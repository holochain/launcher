#![deny(clippy::all)]

use holochain_conductor_api::{
  conductor::{ConductorConfig, KeystoreConfig},
  AdminInterfaceConfig, InterfaceDriver,
};
use holochain_p2p::kitsune_p2p::{
  dependencies::kitsune_p2p_types::config::tuning_params_struct::KitsuneP2pTuningParams,
  KitsuneP2pConfig, TransportConfig,
};
use napi::Result;
use napi_derive::napi;
use serde_yaml::{Mapping, Value};
use std::path::{Path, PathBuf};

#[napi]
pub fn overwrite_config(
  config_path: String,
  admin_port: u16,
  keystore_connection_url: String,
  bootstrap_server_url: Option<String>,
  signaling_server_url: Option<String>,
) -> Result<String, String> {
  let create_error =
    |msg: &str| napi::Error::new(napi::Status::GenericFailure.to_string(), String::from(msg));

  let mut config = std::fs::read_to_string(&PathBuf::from(config_path))
    .map_err(|_| create_error("Failed to read file"))
    .and_then(|contents| {
      serde_yaml::from_str::<Value>(&contents).map_err(|_| create_error("Failed to parse YAML"))
    })
    .and_then(|yaml| match yaml {
      Value::Mapping(mapping) => {
        println!("Successfully parsed YAML mapping.");
        Ok(mapping)
      }
      _ => {
        println!("The YAML content is not a mapping.");
        Err(create_error("Expected YAML content to be a mapping"))
      }
    })?;

  let mut websocket_interface = Mapping::new();
  websocket_interface.insert(
    Value::String(String::from("type")),
    Value::String(String::from("websocket")),
  );
  websocket_interface.insert(
    Value::String(String::from("port")),
    Value::Number(admin_port.into()),
  );

  let mut admin_interface = Mapping::new();
  admin_interface.insert(
    Value::String(String::from("driver")),
    Value::Mapping(websocket_interface),
  );

  config.insert(
    Value::String(String::from("admin_interfaces")),
    Value::Sequence(vec![Value::Mapping(admin_interface)]),
  );

  let mut keystore_mapping = Mapping::new();

  keystore_mapping.insert(
    Value::String(String::from("type")),
    Value::String(String::from("lair_server")),
  );
  keystore_mapping.insert(
    Value::String(String::from("connection_url")),
    Value::String(format!("{}", keystore_connection_url)),
  );

  config.insert(
    Value::String(String::from("keystore")),
    Value::Mapping(keystore_mapping),
  );

  // set signal_url and bootstrap_service
  let maybe_network_mapping = config.get_mut(&Value::String(String::from("network")));

  let network_mapping = match signaling_server_url {
    Some(url) => {
      let mut web_rtc_config = Mapping::new();
      web_rtc_config.insert(
        Value::String(String::from("type")),
        Value::String(String::from("webrtc")),
      );
      web_rtc_config.insert(
        Value::String(String::from("signal_url")),
        Value::String(url),
      );

      let mut transport_pool = Vec::new();
      transport_pool.push(Value::Mapping(web_rtc_config));

      let network_mapping = match maybe_network_mapping {
        Some(value) => match value {
          Value::Mapping(mapping) => {
            mapping.insert(
              Value::String(String::from("transport_pool")),
              Value::Sequence(transport_pool),
            );
            mapping.clone()
          }
          _ => {
            return Err(napi::Error::new(napi::Status::InvalidArg.to_string(), String::from("Failed to overwrite config: 'network' value of conductor-config.yaml is of unexpected type")))
          }
        },
        None => {
          let mut mapping = Mapping::new();
          mapping.insert(
            Value::String(String::from("transport_pool")),
            Value::Sequence(transport_pool),
          );
          mapping
        }
      };

      Some(network_mapping)
    }
    None => None,
  };

  let network_mapping = match bootstrap_server_url {
    Some(url) => match network_mapping {
      Some(mut mapping) => {
        mapping.insert(
          Value::String(String::from("bootstrap_service")),
          Value::String(url),
        );
        Some(mapping)
      }
      None => {
        let mut mapping = Mapping::new();
        mapping.insert(
          Value::String(String::from("bootstrap_service")),
          Value::String(url),
        );
        Some(mapping)
      }
    },
    None => network_mapping,
  };

  if let Some(mapping) = network_mapping {
    config.insert(
      Value::String(String::from("network")),
      Value::Mapping(mapping),
    );
  }

  if let Some(network) = config
    .get(&Value::String(String::from("network")))
    .and_then(|v| v.as_mapping())
  {
    if let Some(bootstrap_service) = network
      .get(&Value::String(String::from("bootstrap_service")))
      .and_then(|v| v.as_str())
    {
      println!("Bootstrap Server URL from config: {}", bootstrap_service);
    }
  }

  Ok(serde_yaml::to_string(&config).expect("Could not convert conductor config to string"))
}

#[napi]
pub fn default_conductor_config(
  admin_port: u16,
  conductor_environment_path: String,
  keystore_connection_url: String,
  bootstrap_server_url: String,
  signaling_server_url: String,
) -> String {
  let mut network_config = KitsuneP2pConfig::default();
  network_config.bootstrap_service = Some(url2::url2!("{}", bootstrap_server_url));

  let tuning_params = KitsuneP2pTuningParams::default();

  network_config.tuning_params = std::sync::Arc::new(tuning_params);

  network_config.transport_pool.push(TransportConfig::WebRTC {
    signal_url: signaling_server_url,
  });

  let config = ConductorConfig {
    environment_path: Path::new(&conductor_environment_path).into(),
    dpki: None,
    keystore: KeystoreConfig::LairServer {
      connection_url: url2::url2!("{}", keystore_connection_url),
    },
    admin_interfaces: Some(vec![AdminInterfaceConfig {
      driver: InterfaceDriver::Websocket { port: admin_port },
    }]),
    network: Some(network_config),
    db_sync_strategy: Default::default(),
    tracing_override: None,
    tracing_scope: None,
  };

  serde_yaml::to_string(&config).expect("Failed to convert conductor config to yaml string.")
}

// overwrite conductor config
