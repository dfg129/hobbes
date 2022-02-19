use lambda_runtime::{LambdaEvent, Error}
;
use serde_json::{json, Value};
use tracing::info;
use aws_config::meta::region::RegionProviderChain;
use aws_sdk_eventbridge::{Client, DateTime};
use aws_sdk_eventbridge::model::PutEventsRequestEntry;
use std::time::SystemTime;
use aws_sdk_ssm;


pub async fn  handler(event: LambdaEvent<Value>) -> Result<Value, Error> {
    info!("[handler-fn] : upload event is {:?}", event);

    let (event, _context) = event.into_parts();

    let parsed: Value = serde_json::from_str(&event.to_string())?;
    info!("handler-fn] : parsed event is {}", &parsed);

    let vkey  = &parsed["Records"][0]["s3"]["object"]["key"].to_string();

    let key: String = serde_json::from_str(vkey).unwrap();

    info!("handler-fn] : key is {}", key);

    let region_provider = RegionProviderChain::default_provider().or_else("us-east-1");
    let config = aws_config::from_env().region(region_provider).load().await;
        
    let ssm_client = aws_sdk_ssm::Client::new(&config);

    let _bucket_name =  get_bucket_name(&ssm_client).await.unwrap();
    
    let client = Client::new(&config);

    let dt = DateTime::from(SystemTime::now());

    let detail = format!("{}{}{}", r#"{ "key": ""#, key, r#""}"#);
    
    let event_bus_name = get_event_bus_name(&ssm_client).await.unwrap();
    let resources = vec!["arn:aws:lambda:us-east-1:707338571369:function:S3Stack-LambdaDatafileEventD9747E0A-XHvilRTP7w25".to_string()];

    let entry = PutEventsRequestEntry::builder()
      .set_time(Some(dt))
      .set_detail(Some(detail.to_string()))
      .set_detail_type(Some("detail-type-this".to_string()))
      .set_event_bus_name(Some(event_bus_name.to_string()))
      .set_source(Some("LambdaDatfileEvent".to_string()))
      .set_trace_header(Some("trace-test".to_string()))
      .set_resources(Some(resources))
      .build(); 
      
    let entries = Some(vec![entry]);

    let resp = client.put_events().set_entries(entries).send().await;
   
        match resp {
            Ok(entry) => info!("[handler-fn] ----successful event entry ----\n {:?} ", entry,
            Err(e) => info!("[handler-fn] -- unsuccessful event entry : {}", e),
        }

    Ok(json!({"message": format!("Hey now {}", "success")}))
}

async fn get_event_bus_name(client: &aws_sdk_ssm::Client) -> Option<String> {
    let resp = client.get_parameter().name("HobbesEventBus").send().await;
    let name_opt = resp.unwrap();
    let param_opt = name_opt.parameter;

    let param = param_opt.unwrap();
    let name = param.value().unwrap();

    Some(name.to_string())
}

async fn get_bucket_name(client: &aws_sdk_ssm::Client) -> Option<String> {
    let resp = client.get_parameter().name("DatafilesBucket").send().await;
    let name_opt = resp.unwrap();
    let param_opt = name_opt.parameter;

    let param = param_opt.unwrap();
    let name = param.value().unwrap();

    Some(name.to_string())
}


#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}
