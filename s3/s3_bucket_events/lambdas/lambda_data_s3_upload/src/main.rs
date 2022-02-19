use lambda_runtime::{service_fn, Error};
use event_fired_on_data_put::handler;

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