use lambda_runtime::{service_fn, LambdaEvent, Error};
use serde_json::{json, Value};
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Error> {
    println!("##### got to here !!!");
    
    tracing_subscriber::fmt()
    .with_max_level(tracing::Level::INFO)
    .with_ansi(false)
    .without_time()
    .init();

    let func = service_fn(func);
    lambda_runtime::run(func).await?;
    Ok(())
}

async fn func(event: LambdaEvent<Value>) -> Result<Value, Error> {
    info!("[handler-fn] : event is {:?}", event);
    let (event, _context) = event.into_parts();
    let first_name = event["firstName"].as_str().unwrap_or("world");

    Ok(json!({"message": format!("Hello, {}!", first_name) }))
}
