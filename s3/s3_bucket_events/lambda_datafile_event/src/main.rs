// use aws_smithy_http::byte_stream::AggregatedBytes;
use lambda_runtime::{service_fn, LambdaEvent, Error};
use serde_json::{json, Value};
use tracing::info;
use aws_config::meta::region::RegionProviderChain;
use aws_sdk_eventbridge::{Client, DateTime};
use aws_sdk_eventbridge::model::PutEventsRequestEntry;
use std::time::SystemTime;
use aws_sdk_ssm;


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
    
    let client = Client::new(&config);

    let dt = DateTime::from(SystemTime::now());

    let detail = "{ \"key\": }".to_string();
    let event_bus_name = get_event_bus_name(&ssm_client).await.unwrap();
    let resources = vec!["arn:aws:lambda:us-east-1:707338571369:function:S3Stack-LambdaDatafileEventD9747E0A-XHvilRTP7w25".to_string()];

    let entry = PutEventsRequestEntry::builder()
      .set_time(Some(dt))
      .set_detail(Some(detail))
      .set_detail_type(Some("detail-type-this".to_string()))
      .set_event_bus_name(Some(event_bus_name.to_string()))
      .set_source(Some("LambdaDatfileEvent".to_string()))
      .set_trace_header(Some("trace-test".to_string()))
      .set_resources(Some(resources))
      .build(); 
      
    info!("[handler-fn] : --------   entry  ------  {:?}", &entry); 
    
    let entries = Some(vec![entry]);

    

    let resp = client.put_events().set_entries(entries).send().await;
   
        match resp {
            Ok(whatup) => info!("[handler-fn] ------------------ whatup? ----\n {:?} ", whatup),
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


async fn get_event_bus_name(client: &aws_sdk_ssm::Client) -> Option<String> {
    let resp = client.get_parameter().name("HobbesEventBus").send().await;
    let name_opt = resp.unwrap();
    let param_opt = name_opt.parameter;

    let param = param_opt.unwrap();
   
    let name = param.value().unwrap();

    info!("[get_event_bus_name] : response is {:?}", name );

    Some(name.to_string())
}

async fn get_bucket_name(client: &aws_sdk_ssm::Client) -> Option<String> {
    let resp = client.get_parameter().name("DatafilesBucket").send().await;
    let name_opt = resp.unwrap();
    let param_opt = name_opt.parameter;

    let param = param_opt.unwrap();
   
    let name = param.value().unwrap();

    info!("[get_bucket_name] : response is {:?}", name );

    Some(name.to_string())
}

