
use serde_json::{json, Value, Error};


fn main() {
    let key = "Datafile.csv";

    let event = get_json().unwrap();

    let parsed: Value = serde_json::from_str(&event.to_string()).unwrap();
    println!("handler-fn] : parsed event is {}", &parsed);

    let key = &parsed["Records"][0]["s3"]["object"]["key"].to_string();
    let cleankey: String = serde_json::from_str(key).unwrap();
    let seckey = "Datatest.csv";

    println!("handler-fn] : key is {} and second is {}", cleankey, seckey);


    // let look = format!("{}{}{}", r#""{ \"key\": \""#, cleankey, r#"\"}""#).to_s;
  //  println!("{}", look);
}


fn get_json() -> Result<Value, Error> {
    let event = json!({
        "Records": [
            {
                "awsRegion": "us-east-1",
                "eventName": "ObjectCreated:Put",
                "eventSource": "aws:s3",
                "eventTime": "2022-02-18T17:04:36.435Z",
                "eventVersion": "2.1",
                "requestParameters": {
                    "sourceIPAddress": "98.0.38.109"
                },
                "responseElements": {
                    "x-amz-id-2": "3jjqNXNEQNI6+PTPyGwxt5V+yIDjh7E0k6vqNukl7YyX86yG9bInErZE2yWg44wG39UO9Kxzd8C7Ycuti7sxUqBFfEXoW7vq",
                    "x-amz-request-id": "29SY8QY2WKXN8V25"
                },
                "s3": {
                    "bucket": {
                        "arn": "arn:aws:s3:::s3stack-datafilebucket1d785be8-z9uw8oos1yy",
                        "name": "s3stack-datafilebucket1d785be8-z9uw8oos1yy",
                        "ownerIdentity": {
                            "principalId": "A157M1NGD8V6YX"
                        }
                    },
                    "configurationId": "YzQyNGVmYzYtOGZkZi00NmU2LTg5ZDMtY2VmODQzZmVhMGM4",
                    "object": {
                        "eTag": "52a47585b82cf8950551c60507cc1f0d",
                        "key": "DataFile.csv",
                        "sequencer": "00620FD1A45B923790",
                        
                    },
                    "s3SchemaVersion": "1.0"
                },
                "userIdentity": {
                    "principalId": "AWS:AIDA2JMFKBZUXC46H7Q75"
                }
            }
        ]
    });
    Ok(event)
}