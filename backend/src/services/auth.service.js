/**
 * Authentication Service
 * Implements password verification, token creation, and user retrieval
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_customer_intelligence_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
  async login(username, password) {
    if (!username || !password) {
      const err = new Error('Username and password are required.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const user = await userRepository.findByUsername(username);
    if (!user) {
      const err = new Error('Invalid username or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (!user.is_active) {
      const err = new Error('User account has been deactivated. Please contact an administrator.');
      err.statusCode = 403;
      err.code = 'ACCOUNT_DEACTIVATED';
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid username or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: user.roles
      }
    };
  }

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      roles: user.roles,
      lastLoginAt: user.last_login_at
    };
  }
}

module.exports = new AuthService();
