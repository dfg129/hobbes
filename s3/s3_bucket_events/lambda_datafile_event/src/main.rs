// use aws_smithy_http::byte_stream::AggregatedBytes;
use lambda_runtime::{service_fn, LambdaEvent, Error};
use serde_json::{json, Value};
use tracing::info;
use aws_config::meta::region::RegionProviderChain;
// use aws_sdk_s3::Client;


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
    info!("[handler-fn] : upload event is {:?}", event);

    let (event, _context) = event.into_parts();

    let parsed: Value = serde_json::from_str(&event.to_string())?;
    info!("handler-fn] : parsed event is {}", &parsed);

    let key  = &parsed["Records"][0]["s3"]["object"]["key"];

    info!("handler-fn] : key is {}", key.as_str().unwrap());


    let region_provider = RegionProviderChain::default_provider().or_else("us-east-1");
    let config = aws_config::from_env().region(region_provider).load().await;
        
    let ssm_client = aws_sdk_ssm::Client::new(&config);

    let _bucket_name =  get_bucket_name(&ssm_client).await.unwrap();
    
    let eb_client = aws_sdk_eventbridge::Client::new(&config);

    let resp = eb_client
        .describe_event_bus()
        .send().await;
   
        match resp {
            Ok(buslist) => info!("[handler-fn] ------------------ event buses ----\n {:?} ", buslist),
            Err(e) => info!("[handler-fn] -- not this one: {}", e),
        }


    //let put_events = aws_sdk_eventbridge::Client::put_events(&eb_client);

    //put_event.send(); 

//    let file = get_object(&s3_client, &bucket_name, key).await?;

 //   info!("[handler-fn] : Read the s3 object {:?}", file);

    Ok(json!({"message": format!("Hey now {}", "hobbes")}))
}

// get s3 file object to parse 
// async fn get_object(client: &Client, bucket: &str, key: &str) -> Result<AggregatedBytes, Error> {
//     let resp = client.get_object().bucket(bucket).key(key).send().await?;
//     let data = resp.body.collect().await;

//     let buffer = data.unwrap();
    
//     info!("[get_object-fn] : data is {:?}", &buffer);
//     Ok(buffer)
// }

async fn get_bucket_name(client: &aws_sdk_ssm::Client) -> Option<String> {
    let resp = client.get_parameter().name("DatafilesBucket").send().await;
    let name_opt = resp.unwrap();
    let param_opt = name_opt.parameter;

    let param = param_opt.unwrap();
   
    let name = param.value().unwrap();

    info!("[get-bucket-name] : response is {:?}", name );

    Some(name.to_string())
}

