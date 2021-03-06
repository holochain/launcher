use lair_keystore_manager::error::LaunchChildError;
use std::{fs, path::PathBuf};
use tauri::api::process::{Command, CommandChild, CommandEvent};

use crate::installed_web_app_info::{InstalledWebAppInfo, WebUiInfo};

pub fn launch_caddy_process(
  caddyfile_path: PathBuf,
) -> Result<CommandChild, LaunchChildError> {
  let (mut caddy_rx, command_child) = Command::new_sidecar("caddy")
    .or(Err(LaunchChildError::BinaryNotFound))?
    .args(&[
      "run",
      "--config",
      caddyfile_path.as_os_str().to_str().unwrap(),
    ])
    .spawn()
    .map_err(|err| LaunchChildError::FailedToExecute(format!("{:?}", err)))?;

  tauri::async_runtime::spawn(async move {
    // read events such as stdout
    while let Some(event) = caddy_rx.recv().await {
      match event.clone() {
        CommandEvent::Stdout(line) => log::info!("[CADDY] {}", line),
        CommandEvent::Stderr(line) => log::info!("[CADDY] {}", line),
        _ => log::info!("[CADDY] {:?}", event),
      }
    }
  });
  log::info!("Launched caddy");

  Ok(command_child)
}

pub fn reload_caddy(caddyfile_path: PathBuf) -> Result<(), LaunchChildError> {
  Command::new_sidecar("caddy")
    .or(Err(LaunchChildError::BinaryNotFound))?
    .args(&[
      "reload",
      "--config",
      caddyfile_path.as_os_str().to_str().unwrap(),
    ])
    .spawn()
    .map_err(|err| LaunchChildError::FailedToExecute(format!("{:?}", err)))?;

  Ok(())
}

pub const LAUNCHER_ENV_URL: &str = ".launcher-env.json";

pub fn write_caddyfile(
  caddyfile_path: PathBuf,
  caddy_admin_port: u16,
  conductor_admin_port: u16,
  conductor_app_interface_port: u16,
  installed_apps: &Vec<InstalledWebAppInfo>,
) -> () {
  let new_caddyfile = build_caddyfile_contents(
    caddy_admin_port,
    conductor_admin_port,
    conductor_app_interface_port,
    installed_apps,
  );

  fs::write(caddyfile_path.clone(), new_caddyfile).expect("Could not write Caddyfile");
}

fn build_caddyfile_contents(
  caddy_admin_port: u16,
  conductor_admin_port: u16,
  conductor_app_interface_port: u16,
  installed_apps: &Vec<InstalledWebAppInfo>,
) -> String {
  let mut caddyfile = format!(
    r#"{{
    admin localhost:{}
  }}
  "#,
    caddy_admin_port
  );

  for installed_web_app_info in installed_apps {
    if let WebUiInfo::WebApp {
      path_to_web_app,
      app_ui_port,
    } = installed_web_app_info.web_ui_info.clone()
    {
      caddyfile = format!(
        "{}

        {}",
        caddyfile,
        caddyfile_config_for_app(
          conductor_admin_port,
          conductor_app_interface_port,
          &installed_web_app_info.installed_app_info.installed_app_id,
          app_ui_port,
          path_to_web_app
        )
      );
    }
  }

  caddyfile
}

fn caddyfile_config_for_app(
  conductor_admin_port: u16,
  conductor_app_interface_port: u16,
  app_id: &String,
  app_ui_port: u16,
  web_app_files_path: PathBuf,
) -> String {
  format!(
    r#":{} {{
      handle_path /{} {{
              respond 200 {{
                      body `{{
                              "APP_INTERFACE_PORT": {},
                              "ADMIN_INTERFACE_PORT": {},
                              "INSTALLED_APP_ID": "{}"
                      }}`
                      close
              }}
      }}

      header /*.js Content-Type text/javascript
      header Cache-Control no-cache, no-store

      handle {{
              root * "{}"
              try_files {{path}} {{file}} /index.html
              file_server
      }}
}}
"#,
    app_ui_port,
    LAUNCHER_ENV_URL,
    conductor_app_interface_port,
    conductor_admin_port,
    app_id.clone(),
    web_app_files_path.into_os_string().to_str().unwrap(),
  )
}
