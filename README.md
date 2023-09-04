## Description


## Installation

```bash
$ npm install

$ npm install -g prisma
```

## Running the app

```bash
# run the migrations
$ npx prisma migrate dev

# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Endpoints
### Rides
- `GET /rides` Retrieves the rides
- `PUT /rides/:id/accept` Accepts a ride by the driver
- `PUT /rides/:id/cancel` Cancels a ride by the user
- `PUT /rides/:id/complete` Completes a ride by the driver

### Drivers
- `PUT /drivers/me/toggle-availability` Toggles driver availability. If he is available, it will set him to unavailable and vice versa.

## Assumptions and Notes

- The `/rides` simply returns all the rides. It does not filter by driver or user. Also, it's not paginated. We could improve it by paginating the results and filtering by driver or user.
- All endpoints are protected by JWT. The JWT is passed in the `Authorization` header. The rider app should pass the JWT in the header when calling the endpoints. While the user app should pass the JWT in the header when calling the endpoints.
- I assume accepting a ride is starting the ride, and done by the driver, hence the `Authorization` header should be the driver's JWT.
- I assume completing a ride is ending the ride and done by the driver, hence the `Authorization` header should be the driver's JWT.
- I assume cancelling a ride is done by the user. Hence, the `Authorization` header should be the user's JWT.
- I have includes some tests for the endpoints. I have not included some e2e tests to test functionality of ride accepting, canceling and completion. Also included are tests for the driver's toggle availability endpoint.
- I have use MySql database for this project with Prisma. But any other database can be used by changing the `DATABASE_URL` in the `.env` file. and also changing the provider in `schema.prisma` file.
## Test

```bash
# e2e tests
$ npm run test:e2e
```

