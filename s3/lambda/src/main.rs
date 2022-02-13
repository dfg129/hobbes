use lambda_runtime::{service_fn, LambdaEvent, Error};
use serde_json::{json, Value};
use tracing::info;
use aws_config::meta::region::RegionProviderChain;
use aws_sdk_s3::Client;

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
    let s3_client = aws_sdk_s3::Client::new(&config);
    let ssm_client = aws_sdk_ssm::Client::new(&config);

    let bucket_name =  get_bucket_name(&ssm_client).await.unwrap();
    let key = "DataFile.csv";

    let file = get_object(&s3_client, &bucket_name, key);

    Ok(json!({"message": format!("Hey now {}", "hobbes")}))
}

// get s3 file object to parse 
async fn get_object(client: &Client, bucket: &str, key: &str) -> Result<(), Error> {
    let resp = client.get_object().bucket(bucket).key(key).send().await?;
    let data = resp.body.collect().await;
    info!("[get_object-fn] : data is {:?}", &data);
    Ok(())
}

async fn get_bucket_name(client: &aws_sdk_ssm::Client) -> Option<String> {
    let resp = client.get_parameter().name("DatafilesBucket").send().await;
    let name_opt = resp.unwrap();
    let param_opt = name_opt.parameter;

    let param = param_opt.unwrap();
   
    let name = param.value().unwrap();

    info!("[get-bucket-name] : response is {:?}", name );

    Some(name.to_string())
}

