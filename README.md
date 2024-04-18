# On-the-Fly Image Resize for AWS Lambda

# requirements
Nodejs 16.X

# setup
```bash
$ git clone https://github.com/raj1rana/AWS_lambda_resize_image_on_fly.git
$ cd  AWS_lambda_resize_image_on_fly
$ npm install

```

# AWS setup
- create an AWS lambda function
    - select runtime as Nodejs16.X
    - create a role  for your Lambda Function to access aws s3 bucket with following policy
    - ```json
            {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": "arn:aws:s3:::your-bucket-name/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }
            ]
        }
    - create an API gateway and choose target as Lambda service.
    - API service will provide a public Endpoint for your lambda function.


# Query and Issues
please feel free to contact me at ```rajendra.singh.rana@protonmail.com``` and feel free to post any issue.