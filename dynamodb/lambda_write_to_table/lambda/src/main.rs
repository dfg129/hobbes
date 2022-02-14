use aws_config::meta::region::RegionProviderChain;
use aws_sdk_dynamodb::model::{AttributeAction, AttributeValue};
use aws_sdk_dynamodb::{Client, Region};
use lambda_runtime::{service_fn, Error, LambdaEvent};
use serde_json::{json, Value};
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_ansi(false)
        .without_time()
        .init();

    let func = service_fn(handler);
    lambda_runtime::run(func).await?;
    Ok(())
}

async fn handler(event: LambdaEvent<Value>) -> Result<Value, Error> {
    info!("[handler-fn] : event is {:?}", event);

    let region_provider = RegionProviderChain::default_provider().or_else("us-east-1");
    let config = aws_config::from_env().region(region_provider).load().await;
    let client = Client::new(&config);

    add_item(
        &client,
        "CreateTableStack-TableOne3E3EE4FC-12RDE7V8W6MVG",
        "hobbes",
        "portland",
    )
    .await?;

    Ok(json!({ "message": format!("Hello, {}!", "hobbes") }))
}

async fn add_item(client: &Client, table: &str, id: &str, city: &str) -> Result<(), Error> {
    let id_av = AttributeValue::S(id.into());
    let city_av = AttributeValue::S(city.into());

    let request = client
        .put_item()
        .table_name(table)
        .item("id", id_av)
        .item("city", city_av);

    request.send().await?;
    info!("[add_item] :  request sent");

    Ok(())
}
