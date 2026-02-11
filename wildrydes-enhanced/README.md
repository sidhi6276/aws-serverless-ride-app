# 🦄 Wild Rydes - Serverless Web Application

Welcome to Wild Rydes! A modern, serverless web application that lets users request unicorn rides to their destination. This project demonstrates the power of AWS services including Lambda, API Gateway, DynamoDB, Cognito, and Amplify.

![Wild Rydes](https://img.shields.io/badge/Status-Active-success)
![AWS](https://img.shields.io/badge/AWS-Serverless-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🌟 Features

- **User Authentication** - Secure sign-up and sign-in with AWS Cognito
- **Interactive Map** - Click-to-select pickup locations using ArcGIS
- **Real-time Ride Requests** - Request unicorn rides via API Gateway and Lambda
- **Serverless Backend** - Fully serverless architecture with AWS services
- **Responsive Design** - Beautiful, modern UI that works on all devices
- **Persistent Storage** - Ride data stored in DynamoDB

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│             │     │              │     │             │
│  Amplify    │────▶│   Cognito    │────▶│ API Gateway │
│  (Hosting)  │     │ (Auth)       │     │             │
│             │     │              │     │             │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
                                                 ▼
                                         ┌───────────────┐
                                         │               │
                                         │    Lambda     │
                                         │   Function    │
                                         │               │
                                         └───────┬───────┘
                                                 │
                                                 ▼
                                         ┌───────────────┐
                                         │               │
                                         │   DynamoDB    │
                                         │               │
                                         └───────────────┘
```

## 🚀 Quick Start

### Prerequisites

- AWS Account ([Sign up here](https://aws.amazon.com))
- GitHub Account
- Modern web browser

### Option 1: Use CDN Libraries (Recommended - Easiest!)

The HTML files are already configured to use CDN links for required libraries:
- jQuery 3.1.0
- Bootstrap 3.3.7
- AWS Cognito SDK

Just proceed with the AWS setup steps below!

### Option 2: Local Libraries

If you prefer to host libraries locally, see `SETUP_NOTES.md` for download instructions.

## 📋 Setup Instructions

### Module 1: Static Web Hosting with AWS Amplify

1. **Fork this Repository**
   ```bash
   # Fork this repo to your GitHub account
   ```

2. **Deploy with AWS Amplify**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Connect your GitHub account
   - Select your forked repository
   - Click "Save and deploy"

3. **Note your Amplify URL**
   ```
   Example: https://main.d111111abcdef8.amplifyapp.com
   ```

### Module 2: User Authentication with Cognito

1. **Create Cognito User Pool**
   - Go to [Amazon Cognito Console](https://console.aws.amazon.com/cognito/)
   - Click "Create user pool"
   - Choose "Email" as sign-in option
   - Keep default settings
   - Note your **User Pool ID** (e.g., `us-east-1_abcd1234`)

2. **Create App Client**
   - In your user pool, go to "App integration"
   - Create an app client (no client secret)
   - Note your **App Client ID**

3. **Update Configuration**
   - Edit `js/config.js`:
   ```javascript
   window._config = {
       cognito: {
           userPoolId: 'us-east-1_XXXXXXXXX',  // Your User Pool ID
           userPoolClientId: 'XXXXXXXXXXXXXXX', // Your App Client ID
           region: 'us-east-1'
       },
       api: {
           invokeUrl: '' // Leave empty for now
       }
   };
   ```

4. **Commit and Deploy**
   ```bash
   git add js/config.js
   git commit -m "Add Cognito configuration"
   git push
   ```
   Amplify will automatically redeploy!

### Module 3: Serverless Backend

1. **Create DynamoDB Table**
   - Go to [DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
   - Create table named `Rides`
   - Partition key: `RideId` (String)
   - Use default settings

2. **Create IAM Role for Lambda**
   - Go to [IAM Console](https://console.aws.amazon.com/iam/)
   - Create role for Lambda
   - Attach `AWSLambdaBasicExecutionRole`
   - Add inline policy for DynamoDB:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [{
           "Effect": "Allow",
           "Action": [
               "dynamodb:PutItem"
           ],
           "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Rides"
       }]
   }
   ```

3. **Create Lambda Function**
   - Go to [Lambda Console](https://console.aws.amazon.com/lambda/)
   - Create function named `RequestUnicorn`
   - Runtime: Node.js 20.x
   - Use the IAM role you created
   - Copy code from `lambda/RequestUnicorn.js`:

   ```javascript
   const AWS = require('aws-sdk');
   const ddb = new AWS.DynamoDB.DocumentClient();
   const randomBytes = require('crypto').randomBytes;

   const fleet = [
       { Name: 'Shadowfax', Color: 'Silver', Gender: 'Male' },
       { Name: 'Bucephalus', Color: 'Golden', Gender: 'Male' },
       { Name: 'Rocinante', Color: 'Yellow', Gender: 'Female' },
   ];

   exports.handler = async (event, context) => {
       if (!event.requestContext.authorizer) {
           return errorResponse('Authorization not configured', context.awsRequestId);
       }

       const rideId = toUrlString(randomBytes(16));
       const username = event.requestContext.authorizer.claims['cognito:username'];
       const requestBody = JSON.parse(event.body);
       const pickupLocation = requestBody.PickupLocation;
       const unicorn = findUnicorn(pickupLocation);

       await recordRide(rideId, username, unicorn);

       return {
           statusCode: 201,
           body: JSON.stringify({
               RideId: rideId,
               Unicorn: unicorn,
               Eta: '30 seconds',
               Rider: username,
           }),
           headers: {
               'Access-Control-Allow-Origin': '*',
           },
       };
   };

   function findUnicorn(pickupLocation) {
       return fleet[Math.floor(Math.random() * fleet.length)];
   }

   async function recordRide(rideId, username, unicorn) {
       return ddb.put({
           TableName: 'Rides',
           Item: {
               RideId: rideId,
               User: username,
               Unicorn: unicorn,
               RequestTime: new Date().toISOString(),
           },
       }).promise();
   }

   function toUrlString(buffer) {
       return buffer.toString('base64')
           .replace(/\+/g, '-')
           .replace(/\//g, '_')
           .replace(/=/g, '');
   }

   function errorResponse(errorMessage, awsRequestId) {
       return {
           statusCode: 500,
           body: JSON.stringify({
               Error: errorMessage,
               Reference: awsRequestId,
           }),
           headers: {
               'Access-Control-Allow-Origin': '*',
           },
       };
   }
   ```

4. **Deploy Lambda Function**
   - Click "Deploy"
   - Test with sample event

### Module 4: API Gateway

1. **Create REST API**
   - Go to [API Gateway Console](https://console.aws.amazon.com/apigateway/)
   - Create REST API named `WildRydes`

2. **Create Cognito Authorizer**
   - In your API, go to "Authorizers"
   - Create new authorizer
   - Type: Cognito
   - Select your User Pool
   - Token Source: `Authorization`

3. **Create Resource and Method**
   - Create resource `/ride`
   - Create POST method
   - Integration type: Lambda Function
   - Select your `RequestUnicorn` function
   - Enable Lambda Proxy Integration
   - Use your Cognito authorizer

4. **Enable CORS**
   - Select `/ride` resource
   - Actions → Enable CORS
   - Deploy API to `prod` stage

5. **Update Configuration**
   - Copy your Invoke URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)
   - Edit `js/config.js`:
   ```javascript
   api: {
       invokeUrl: 'https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod'
   }
   ```

6. **Commit and Deploy**
   ```bash
   git add js/config.js
   git commit -m "Add API Gateway URL"
   git push
   ```

## 🧪 Testing

1. **Register a new user**
   - Go to your Amplify URL
   - Click "Sign In" → "Register"
   - Enter email and password
   - Check your email for verification code

2. **Verify your email**
   - Enter verification code
   - Sign in with your credentials

3. **Request a ride**
   - Click on the map to set pickup location
   - Click "Request Unicorn"
   - Watch your unicorn arrive!

4. **Verify in DynamoDB**
   - Check DynamoDB console
   - View items in `Rides` table

## 📁 Project Structure

```
wildrydes-site/
├── index.html              # Landing page
├── ride.html              # Main ride request page with map
├── register.html          # User registration
├── signin.html            # User sign in
├── verify.html            # Email verification
├── unicorns.html          # Unicorn fleet info
├── faq.html              # FAQ page
├── investors.html         # Investor information
├── apply.html            # Driver application
├── css/
│   ├── main.css          # Main stylesheet (enhanced)
│   └── font.css          # Font imports
├── js/
│   ├── config.js         # AWS configuration
│   ├── cognito-auth.js   # Authentication logic
│   ├── esri-map.js       # Map integration
│   └── ride.js           # Ride request logic
├── lambda/
│   └── RequestUnicorn.js # Lambda function code
├── README.md             # This file
└── SETUP_NOTES.md        # Detailed setup notes
```

## 🎨 New Features in This Version

### Enhanced UI/UX
- ✨ Modern gradient design
- 🎯 Improved navigation
- 📱 Fully responsive layout
- 🌈 Beautiful animations
- 💫 Better typography

### Improved Ride Page
- 🗺️ Clearer map interface
- 📍 Visual pickup instructions
- 📊 Real-time updates sidebar
- 🎨 Modern panel design

### Better Code Organization
- 📦 CDN-based libraries (easier setup)
- 🔧 Improved configuration
- 📝 Better documentation
- 🐛 Bug fixes

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: ArcGIS API
- **Authentication**: AWS Cognito
- **Backend**: AWS Lambda (Node.js 20.x)
- **Database**: Amazon DynamoDB
- **API**: Amazon API Gateway
- **Hosting**: AWS Amplify
- **UI Libraries**: jQuery, Bootstrap

## 🔒 Security Best Practices

- ✅ HTTPS only (enforced by Amplify)
- ✅ Cognito user authentication
- ✅ API Gateway authorization
- ✅ IAM role permissions (least privilege)
- ✅ CORS properly configured
- ✅ No hardcoded credentials

## 💰 AWS Costs

Most services have generous free tiers:

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Amplify | 1,000 build minutes | $0 |
| Cognito | 50,000 MAUs | $0 |
| Lambda | 1M requests | $0 |
| DynamoDB | 25 GB | $0 |
| API Gateway | 1M calls (first 12 months) | $0 |

**Total: $0 - $1/month for testing**

## 🗑️ Cleanup

To avoid charges, delete resources in this order:

1. Amplify app
2. API Gateway API
3. Lambda function
4. Cognito User Pool
5. DynamoDB table
6. IAM role

## 📚 Learning Resources

- [AWS Serverless Workshops](https://aws.amazon.com/serverless-workshops/)
- [AWS Amplify Docs](https://docs.amplify.aws/)
- [Amazon Cognito Docs](https://docs.aws.amazon.com/cognito/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Based on the AWS Wild Rydes Serverless Workshop
- ArcGIS for mapping functionality
- AWS for the amazing serverless platform

## 📞 Support

If you encounter issues:

1. Check `SETUP_NOTES.md` for detailed troubleshooting
2. Review AWS service logs (CloudWatch)
3. Verify configuration in `js/config.js`
4. Check browser console for errors

## 🎯 Next Steps

After completing this project, consider:

- Adding ride history
- Implementing ride cancellation
- Creating an admin dashboard
- Adding real-time notifications
- Building a mobile app with React Native

---

**Happy Coding! 🦄✨**

Made with ❤️ by the Wild Rydes Team
