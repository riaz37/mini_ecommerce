import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      customerId: user.customerId, // Include customerId in the token
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customerId, // Include in the response
      },
    };
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`;

    // Check if customer with this email already exists
    let customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    // Create customer record if it doesn't exist
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          email,
          name,
        },
      });
    }

    // Create user with reference to customer
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        customerId: customer.id, // Link to customer
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async getUserFromToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException();
      }

      const { password, ...result } = user;
      return result;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async getCustomerByEmail(email: string) {
    return this.prisma.customer.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  async generateRefreshToken(userId: string) {
    const payload = { sub: userId };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: '7d',
    });
  }

  async getUserById(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return null;
      }

      const { password, ...result } = user;
      return result;
    } catch (error) {
      console.error(`Error getting user by ID ${userId}:`, error);
      return null;
    }
  }
}
