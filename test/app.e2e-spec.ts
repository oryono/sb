import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import * as argon from 'argon2';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  describe('Auth', () => {
    describe('login', () => {
      beforeAll(async () => {
        try {
          await prisma.user.create({
            data: {
              firstname: 'John',
              lastname: 'Doe',
              email: 'test@email.com',
              phone: '1234567890',
              password: await argon.hash('password'),
            },
          });
        } catch (e) {}
      });

      // afterEach(async () => {
      //   await prisma.user.deleteMany();
      // });
      it('should return a user and token for correct credentials', async () => {
        const body = {
          phone: '1234567890',
          password: 'password',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/user/login')
          .send(body)
          .expect(200);

        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
      });

      it('should return a 403 for incorrect credentials', async () => {
        const body = {
          phone: '1234567890',
          password: 'wrongpassword',
        };

        await request(app.getHttpServer())
          .post('/auth/user/login')
          .set('Content-Type', 'application/json')
          .send(body)
          .expect(403)
          .expect({
            message: 'Invalid Credentials',
            error: 'Forbidden',
            statusCode: 403,
          });
      });

      it('should return a 400 for empty body', async () => {
        const body = {};

        const response = await request(app.getHttpServer())
          .post('/auth/user/login')
          .send(body)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Bad Request');
        expect(response.body).toHaveProperty('statusCode', 400);
      });

      it('should return a 400 for empty phone number', async () => {
        const body = {
          phone: '',
          password: 'password',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/user/login')
          .send(body)
          .expect(400);

        expect(response.body).toHaveProperty('message', [
          'phone should not be empty',
        ]);
      });

      it('should return a 400 for empty password', async () => {
        const body = {
          phone: '1234567890',
          password: '',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/user/login')
          .send(body)
          .expect(400);

        expect(response.body).toHaveProperty('message', [
          'password should not be empty',
        ]);
      });
    });
    describe('register', () => {
      describe('user', () => {
        beforeEach(async () => {
          try {
            await prisma.user.deleteMany();
          } catch (e) {}
        });
        it('should create a user successfully', async () => {
          const body = {
            firstname: 'John',
            lastname: 'Doe',
            email: 'test@email.com',
            phone: '1234567890',
            password: 'password',
          };
          await request(app.getHttpServer())
            .post('/auth/user/register')
            .send(body)
            .expect(201);
        });

        it('should return a 400 for wrong body', async () => {
          const body = {
            firstname: 'John',
            lastname: 'Doe',
            email: 'test', //wrong email
            password: 'password',
          };
          const response = await request(app.getHttpServer())
            .post('/auth/user/register')
            .send(body)
            .expect(400);
        });
      });
      describe('driver', () => {
        beforeEach(async () => {
          try {
            await prisma.driver.deleteMany();
          } catch (e) {}
        });
        it('should create create a driver successfully', async () => {
          const body = {
            firstname: 'John',
            lastname: 'Doe',
            email: 'test@gmail.com',
            phone: '1234567891',
            password: 'password',
          };
          const response = await request(app.getHttpServer())
            .post('/auth/driver/register')
            .send(body)
            .expect(201);
        });
        it('should return a 400 for wrong body', async () => {
          const body = {
            firstname: 'John',
            lastname: 'Doe',
            email: 'test', //wrong email
            password: 'password',
          };
          const response = await request(app.getHttpServer())
            .post('/auth/driver/register')
            .send(body)
            .expect(400);
        });
      });
    });
  });
  describe('Rides', () => {
    afterEach(async () => {
      await prisma.ride.deleteMany();
      await prisma.driver.deleteMany();
      await prisma.user.deleteMany();
    });

    beforeEach(async () => {
      // Create a user
      // Create a driver and
      // Create a ride
      try {
        const user = await prisma.user.create({
          data: {
            firstname: 'John',
            lastname: 'Doe',
            email: 'patricken08@gmail.com',
            phone: '1234567890',
            password: await argon.hash('password'),
          },
        });

        const driver = await prisma.driver.create({
          data: {
            firstname: 'John',
            lastname: 'Doe',
            email: 'patricken08@gmail.com',
            phone: '1234567890',
            password: await argon.hash('password'),
          },
        });

        await prisma.ride.create({
          data: {
            user_id: user.id,
            from: 'Lagos',
            to: 'Abuja',
          },
        }); // Create a ride
      } catch (e) {}
    });
    it('should return a list of rides', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/driver/login')
        .send({ phone: '1234567890', password: 'password' });
      const token = loginResponse.body.token;

      const response = await request(app.getHttpServer())
        .get('/rides')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Expect the length to have one ride
      expect(response.body.length).toBe(1);
    });

    describe('accept', () => {
      it('should accept a ride with the right body', async () => {
        // find a ride
        const ride = await prisma.ride.findFirst();
        // login the driver
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/driver/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;
        const driver = loginResponse.body.driver;

        // login the driver
        const response = await request(app.getHttpServer())
          .put(`/rides/${ride.id}/accept`)
          .send({ driverId: driver.id })
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body).toHaveProperty(
          'message',
          'Successfully accepted ride',
        );

        // Expect ride to be accepted
        const updatedRide = await prisma.ride.findFirst({
          where: { id: ride.id },
        });

        expect(updatedRide.status).toBe('accepted');
        expect(updatedRide.driver_id).toBe(driver.id);
      });

      it('should not throw an exception for an empty body', async () => {
        // find a ride
        const ride = await prisma.ride.findFirst();
        // login the driver
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/driver/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;
        // login the driver
        await request(app.getHttpServer())
          .put(`/rides/${ride.id}/accept`)
          .send({})
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should throw an exception when auth token is not sent', async () => {
        const ride = await prisma.ride.findFirst();

        const response = await request(app.getHttpServer())
          .put(`/rides/${ride.id}/accept`)
          .send({})
          .expect(401);

        expect(response.body).toHaveProperty('message', 'Unauthorized');
      });

      it('should throw an exception when ride is invalid', async () => {
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/driver/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;
        await request(app.getHttpServer())
          .put(`/rides/100000000/accept`)
          .set('Authorization', `Bearer ${token}`)
          .expect(404);
      });

      it('should throw an exception when driver is not available', async () => {
        const ride = await prisma.ride.findFirst();
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/driver/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;
        const driver = loginResponse.body.driver;

        await prisma.driver.update({
          where: { id: driver.id },
          data: { is_available: false },
        });

        const response = await request(app.getHttpServer())
          .put(`/rides/${ride.id}/accept`)
          .send({ driverId: driver.id })
          .set('Authorization', `Bearer ${token}`);

        expect(response.body).toHaveProperty(
          'message',
          'Driver is not available',
        );
      });

      it('should throw an exception when ride is not pending', async () => {
        const ride = await prisma.ride.findFirst();

        await prisma.ride.update({
          where: { id: ride.id },
          data: { status: 'accepted' },
        });

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/driver/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;
        const driver = loginResponse.body.driver;

        const response = await request(app.getHttpServer())
          .put(`/rides/${ride.id}/accept`)
          .send({ driverId: driver.id })
          .set('Authorization', `Bearer ${token}`)
          .expect(400);

        expect(response.body).toHaveProperty(
          'message',
          'Ride is either accepted, canceled or has not been completed by driver',
        );
      });
    });

    describe('complete', () => {
      it('should complete an accepted ride successfully', async () => {
        const ride = await prisma.ride.findFirst();
        const driver = await prisma.driver.findFirst();

        await prisma.ride.update({
          where: { id: ride.id },
          data: { status: 'accepted', driver_id: driver.id },
        });

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/driver/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;
        await request(app.getHttpServer())
          .put(`/rides/${ride.id}/complete`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      test('driver becomes available after completing a ride', async () => {
        const ride = await prisma.ride.findFirst();

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/driver/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;
        const driver = loginResponse.body.driver;

        // make sure ride is accepted
        await prisma.ride.update({
          where: { id: ride.id },
          data: { status: 'accepted', driver_id: driver.id },
        });

        // Make driver unavailable
        await prisma.driver.update({
          where: { id: driver.id },
          data: { is_available: false },
        });
        await request(app.getHttpServer())
          .put(`/rides/${ride.id}/complete`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        const updatedDriver = await prisma.driver.findFirst({
          where: { id: driver.id },
        });

        expect(updatedDriver.is_available).toBe(true);
        expect(updatedDriver.id).toBe(driver.id);

        // Expect ride to be completed
        const updatedRide = await prisma.ride.findFirst({
          where: { id: ride.id },
        });

        expect(updatedRide.status).toBe('completed');
      });

      it('should throw an exception when ride is not accepted', async () => {
        const ride = await prisma.ride.findFirst();

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/driver/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;

        const response = await request(app.getHttpServer())
          .put(`/rides/${ride.id}/complete`)
          .set('Authorization', `Bearer ${token}`)
          .expect(400);
        expect(response.body).toHaveProperty(
          'message',
          'Ride is either complete, canceled or has not been accepted by rider',
        );
      });

      it('should throw an exception when ride is complete', async () => {
        const ride = await prisma.ride.findFirst();

        await prisma.ride.update({
          where: { id: ride.id },
          data: { status: 'completed' },
        });

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/driver/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;

        const response = await request(app.getHttpServer())
          .put(`/rides/${ride.id}/complete`)
          .set('Authorization', `Bearer ${token}`)
          .expect(400);
        expect(response.body).toHaveProperty(
          'message',
          'Ride is either complete, canceled or has not been accepted by rider',
        );
      });

      it('should throw an exception when ride is canceled', async () => {
        const ride = await prisma.ride.findFirst();

        await prisma.ride.update({
          where: { id: ride.id },
          data: { status: 'canceled' },
        });

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/driver/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;

        const response = await request(app.getHttpServer())
          .put(`/rides/${ride.id}/complete`)
          .set('Authorization', `Bearer ${token}`)
          .expect(400);
        expect(response.body).toHaveProperty(
          'message',
          'Ride is either complete, canceled or has not been accepted by rider',
        );
      });

      it('should throw an exception when ride is invalid', async () => {
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/driver/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;
        const driver = loginResponse.body.driver;
        await request(app.getHttpServer())
          .put(`/rides/100000000/complete`)
          .send({ driverId: driver.id })
          .set('Authorization', `Bearer ${token}`)
          .expect(404);
      });
    });

    describe('cancel', () => {
      it('should cancel an accepted ride successfully', async () => {
        //login a user
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/user/login')
          .send({ phone: '1234567890', password: 'password' });

        const ride = await prisma.ride.findFirst();
        const driver = await prisma.driver.findFirst();

        await prisma.ride.update({
          where: { id: ride.id },
          data: { status: 'accepted', driver_id: driver.id },
        });
        await request(app.getHttpServer())
          .put(`/rides/${ride.id}/cancel`)
          .set('Authorization', `Bearer ${loginResponse.body.token}`)
          .expect(200);
      });

      it('should throw an exception when ride is not accepted', async () => {
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/user/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;

        const ride = await prisma.ride.findFirst();

        const response = await request(app.getHttpServer())
          .put(`/rides/${ride.id}/cancel`)
          .set('Authorization', `Bearer ${token}`)
          .expect(400);
        expect(response.body).toHaveProperty(
          'message',
          'Ride is already canceled, completed or has not been accepted by rider',
        );
      });

      it('should throw an exception when ride is complete', async () => {
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/user/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;

        const ride = await prisma.ride.findFirst();
        const driver = await prisma.driver.findFirst();

        await prisma.ride.update({
          where: { id: ride.id },
          data: { status: 'completed', driver_id: driver.id },
        });

        const response = await request(app.getHttpServer())
          .put(`/rides/${ride.id}/cancel`)
          .set('Authorization', `Bearer ${token}`)
          .expect(400);
        expect(response.body).toHaveProperty(
          'message',
          'Ride is already canceled, completed or has not been accepted by rider',
        );
      });

      it('should throw an exception when ride is canceled', async () => {
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/user/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;
        const ride = await prisma.ride.findFirst();

        const driver = await prisma.driver.findFirst();

        await prisma.ride.update({
          where: { id: ride.id },
          data: { status: 'canceled', driver_id: driver.id },
        });

        const response = await request(app.getHttpServer())
          .put(`/rides/${ride.id}/cancel`)
          .set('Authorization', `Bearer ${token}`)
          .expect(400);
        expect(response.body).toHaveProperty(
          'message',
          'Ride is already canceled, completed or has not been accepted by rider',
        );
      });

      it('should throw an exception when ride is invalid', async () => {
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/user/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;

        await request(app.getHttpServer())
          .put(`/rides/100000000/cancel`)
          .set('Authorization', `Bearer ${token}`)
          .expect(404);
      });

      it('should throw an exception when auth token is not sent', async () => {
        const ride = await prisma.ride.findFirst();

        const response = await request(app.getHttpServer())
          .put(`/rides/${ride.id}/cancel`)
          .expect(401);

        expect(response.body).toHaveProperty('message', 'Unauthorized');
      });

      it('should set driver availability to true when ride is canceled', async () => {
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/user/login')
          .send({ phone: '1234567890', password: 'password' });

        const token = loginResponse.body.token;

        const ride = await prisma.ride.findFirst();

        const driver = await prisma.driver.findFirst();

        // Update driver to unavailable
        await prisma.driver.update({
          where: { id: driver.id },
          data: { is_available: false },
        });

        await prisma.ride.update({
          where: { id: ride.id },
          data: { status: 'accepted', driver_id: driver.id },
        });
        await request(app.getHttpServer())
          .put(`/rides/${ride.id}/cancel`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
        const updatedDriver = await prisma.driver.findFirst({
          where: { id: driver.id },
        });

        expect(updatedDriver.is_available).toBe(true);
      });
    });
  });

  describe('Drivers', () => {
    afterEach(async () => {
      await prisma.driver.deleteMany();
    });

    beforeEach(async () => {
      // Create a driver
      try {
        await prisma.driver.create({
          data: {
            firstname: 'John',
            lastname: 'Doe',
            email: 'patricken08@gmail.com',
            phone: '1234567890',
            password: await argon.hash('password'),
          },
        });
      } catch (e) {}
    });
    it('should toggle driver availability to false when he is available', async () => {
      // Login a driver
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/driver/login')
        .send({ phone: '1234567890', password: 'password' });

      // Call the toggle availability endpoint
      const token = loginResponse.body.token;
      const response = await request(app.getHttpServer())
        .put('/drivers/me/toggle-availability')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('is_available', false);
    });

    it('should toggle driver availability to true when he is unavailable', async () => {
      // Login a driver
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/driver/login')
        .send({ phone: '1234567890', password: 'password' });

      // Call the toggle availability endpoint
      const token = loginResponse.body.token;
      const driver = loginResponse.body.driver;

      await prisma.driver.update({
        where: { id: driver.id },
        data: { is_available: false },
      });

      const response = await request(app.getHttpServer())
        .put('/drivers/me/toggle-availability')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('is_available', true);
    });

    it('should throw an exception when not logged in', async () => {
      await request(app.getHttpServer())
        .put('/drivers/me/toggle-availability')
        .expect(401);
    });
  });
});
