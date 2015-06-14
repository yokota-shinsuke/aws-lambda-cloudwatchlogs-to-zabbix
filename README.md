# CloudWatchLogs-to-Zabbix
This is AWS Lambda function to route CloudWatch Logs log events to Zabbix.

## How To Use
http://dev.classmethod.jp/etc/cloudwatch-logs-to-zabbix/

1, CONFIGURE CloudWatch Logs
1, CREATE Kinesis Stream
2, ENABLE Cloudwatch Logs Subscriptions
3, CREATE Lambda Function
```
aws lambda create-function \
  --function-name "cloudWatchLogsToZabbix" \
  --runtime nodejs\
  --role arn:aws:iam::{your-account-id}:role/lambda_kinesis_role\
  --handler "cloudWatchLogsToZabbix.handler"\
  --timeout 60\
  --zip-file "fileb://cloudWatchLogsToZabbix.zip"\
  --region us-west-2
```

4, SET EVENT SOURCE
```
aws lambda create-event-source-mapping \
  --event-source-arn arn:aws:kinesis:us-west-2:{your-account-id}:stream/{your-stream-name} \
  --function-name cloudWatchLogsToZabbix \
  --starting-position TRIM_HORIZON \
  --region us-west-2
```
