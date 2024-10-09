#![deny(clippy::all)]

use holochain_conductor_api::{
    conductor::{paths::DataRootPath, ConductorConfig, DpkiConfig, KeystoreConfig},
    AdminInterfaceConfig, InterfaceDriver,
};
use holochain_p2p::kitsune_p2p::dependencies::kitsune_p2p_types::config::{
    tuning_params_struct::KitsuneP2pTuningParams, KitsuneP2pConfig, TransportConfig,
};
use holochain_types::websocket::AllowedOrigins;
use napi::{Error, Result, Status};
use napi_derive::napi;
use serde_yaml::{Mapping, Sequence, Value};
use std::{collections::HashSet, path::PathBuf};

fn create_error(msg: &str) -> Error {
    Error::new(Status::GenericFailure, String::from(msg))
}

fn insert_mapping(mapping: &mut Mapping, key: &str, value: Value) {
    mapping.insert(Value::String(String::from(key)), value);
}

fn create_mapping_with_entries(entries: Vec<(&str, Value)>) -> Mapping {
    let mut mapping = Mapping::new();
    for (key, value) in entries {
        insert_mapping(&mut mapping, key, value);
    }
    mapping
}

fn webrtc_config_from_ice_urls(ice_server_urls: Vec<String>) -> serde_json::Value {
    let mut webrtc_config = serde_json::Map::new();
    let mut ice_servers = Vec::new();
    for url in ice_server_urls {
        let mut url_mapping = serde_json::Map::new();
        url_mapping.insert(
            String::from("urls"),
            serde_json::Value::Array(vec![serde_json::Value::String(url)]),
        );
        ice_servers.push(serde_json::Value::Object(url_mapping));
    }
    webrtc_config.insert(
        String::from("ice_servers"),
        serde_json::Value::Array(ice_servers),
    );
    serde_json::Value::Object(webrtc_config)
}

#[napi]
pub fn overwrite_config(
    admin_port: u16,
    keystore_connection_url: String,
    bootstrap_server_url: String,
    signaling_server_url: String,
    config_path: String,
    allowed_origin: String,
    ice_server_urls: Option<Vec<String>>,
) -> Result<String> {
    let mut config = std::fs::read_to_string(&PathBuf::from(config_path))
        .map_err(|_| create_error("Failed to read file"))
        .and_then(|contents| {
            serde_yaml::from_str::<Value>(&contents)
                .map_err(|_| create_error("Failed to parse YAML"))
        })
        .and_then(|yaml| {
            yaml.as_mapping()
                .cloned()
                .ok_or_else(|| create_error("Expected YAML content to be a mapping"))
        })?;

    let websocket_interface = create_mapping_with_entries(vec![
        ("type", Value::String(String::from("websocket"))),
        ("port", Value::Number(admin_port.into())),
        ("allowed_origins", Value::String(allowed_origin)),
    ]);

    let admin_interface =
        create_mapping_with_entries(vec![("driver", Value::Mapping(websocket_interface))]);

    insert_mapping(
        &mut config,
        "admin_interfaces",
        Value::Sequence(vec![Value::Mapping(admin_interface)]),
    );

    insert_mapping(
        &mut config,
        "keystore",
        Value::Mapping(create_mapping_with_entries(vec![
            ("type", Value::String(String::from("lair_server"))),
            ("connection_url", Value::String(keystore_connection_url)),
        ])),
    );

    let network = config
        .get_mut(&Value::String(String::from("network")))
        .and_then(|v| v.as_mapping_mut())
        .ok_or_else(|| create_error("Expected 'network' entry in the config"))?;

    network.insert(
        Value::String(String::from("bootstrap_service")),
        Value::String(bootstrap_server_url),
    );

    let mut webrtc_config = Mapping::new();
    if let Some(ice_urls) = ice_server_urls.clone() {
        let mut ice_servers = Sequence::new();
        for url in ice_urls {
            let mut url_mapping = Mapping::new();
            let mut url_list = Sequence::new();
            url_list.push(Value::String(url));
            insert_mapping(&mut url_mapping, "urls", Value::Sequence(url_list));
            ice_servers.push(Value::Mapping(url_mapping));
        }
        insert_mapping(
            &mut webrtc_config,
            "ice_servers",
            Value::Sequence(ice_servers),
        );
    }

    let transport_pool = network
        .entry(Value::String(String::from("transport_pool")))
        .or_insert_with(|| Value::Sequence(Vec::new()));

    if let Value::Sequence(transport_pool_seq) = transport_pool {
        transport_pool_seq.clear(); // Clear existing transport pool entries
        let mut transport_pool_mapping = create_mapping_with_entries(vec![
            ("type", Value::String(String::from("webrtc"))),
            ("signal_url", Value::String(signaling_server_url)),
        ]);
        if let Some(_) = ice_server_urls {
            insert_mapping(
                &mut transport_pool_mapping,
                "webrtc_config",
                Value::Mapping(webrtc_config),
            );
        }
        transport_pool_seq.push(Value::Mapping(transport_pool_mapping));
    }

    serde_yaml::to_string(&config)
        .map_err(|_| create_error("Could not convert conductor config to string"))
}

#[napi]
pub fn default_conductor_config(
    admin_port: u16,
    keystore_connection_url: String,
    bootstrap_server_url: String,
    signaling_server_url: String,
    conductor_environment_path: String,
    allowed_origin: String,
    use_dpki: bool,
    ice_server_urls: Option<Vec<String>>,
) -> Result<String> {
    let mut network_config = KitsuneP2pConfig::default();
    network_config.bootstrap_service = Some(url2::url2!("{}", bootstrap_server_url));

    let tuning_params = KitsuneP2pTuningParams::default();
    network_config.tuning_params = std::sync::Arc::new(tuning_params);

    let webrtc_config = match ice_server_urls {
        Some(urls) => Some(webrtc_config_from_ice_urls(urls)),
        None => None,
    };

    network_config.transport_pool.push(TransportConfig::WebRTC {
        signal_url: signaling_server_url,
        webrtc_config,
    });

    let mut allowed_origins_map = HashSet::new();
    allowed_origins_map.insert(allowed_origin);

    let dpki_config = match use_dpki {
        true => DpkiConfig::default(),
        false => DpkiConfig::disabled(),
    };

    let config = ConductorConfig {
        data_root_path: Some(DataRootPath::from(PathBuf::from(
            conductor_environment_path,
        ))),
        dpki: dpki_config,
        device_seed_lair_tag: None,
        danger_generate_throwaway_device_seed: false,
        keystore: KeystoreConfig::LairServer {
            connection_url: url2::url2!("{}", keystore_connection_url),
        },
        admin_interfaces: Some(vec![AdminInterfaceConfig {
            driver: InterfaceDriver::Websocket {
                port: admin_port,
                allowed_origins: AllowedOrigins::Origins(allowed_origins_map),
            },
        }]),
        network: network_config,
        db_sync_strategy: Default::default(),
        tracing_override: None,
        tuning_params: None,
    };

    serde_yaml::to_string(&config)
        .map_err(|_| create_error("Failed to convert conductor config to yaml string."))
}
