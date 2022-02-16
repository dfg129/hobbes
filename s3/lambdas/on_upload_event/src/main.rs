use aws_smithy_http::byte_stream::AggregatedBytes;
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

    let (event, _context) = event.into_parts();

    let parsed: Value = serde_json::from_str(&event.to_string())?;
    info!("handler-fn] : event is {}", &parsed);

    let url  = &parsed["getObjectContext"]["inputS3Url"];

     info!("handler-fn] : url is {}", url.as_str().unwrap());

    info!("------------ make reqwest --------------");

    // let client = reqwest::Client::new();
    // let res = client.get(url.as_str().unwrap())
    // .send()
    // .await?; 

    // let body = 

    let body = reqwest::get(url.as_str().unwrap())
        .await?
        .text()
        .await?;

    info!("[handler-fn] : body is {:?}", body);

    let region_provider = RegionProviderChain::default_provider().or_else("us-east-1");
    let config = aws_config::from_env().region(region_provider).load().await;
    let s3_client = aws_sdk_s3::Client::new(&config);
    let ssm_client = aws_sdk_ssm::Client::new(&config);

    let bucket_name =  get_bucket_name(&ssm_client).await.unwrap();
    let key = "DataFile.csv";

    let file = get_object(&s3_client, &bucket_name, key).await?;

    info!("[handler-fn] : Read the s3 object {:?}", file);


    Ok(json!({"message": format!("Hey now {}", "hobbes")}))
}

// get s3 file object to parse 
async fn get_object(client: &Client, bucket: &str, key: &str) -> Result<AggregatedBytes, Error> {
    let resp = client.get_object().bucket(bucket).key(key).send().await?;
    let data = resp.body.collect().await;

    let buffer = data.unwrap();
    
    info!("[get_object-fn] : data is {:?}", &buffer);
    Ok(buffer)
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

