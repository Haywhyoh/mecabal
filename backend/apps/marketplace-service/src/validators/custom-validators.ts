import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListingCategory } from '@app/database';

// Price validation - must be positive
@ValidatorConstraint({ name: 'isPositivePrice', async: false })
export class IsPositivePriceConstraint implements ValidatorConstraintInterface {
  validate(price: number, args: ValidationArguments) {
    return typeof price === 'number' && price > 0;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Price must be a positive number';
  }
}

export function IsPositivePrice(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPositivePriceConstraint,
    });
  };
}

// Future date validation
@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(date: Date | string, args: ValidationArguments) {
    if (!date) return true; // Allow null/undefined for optional fields
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj > new Date();
  }

  defaultMessage(args: ValidationArguments) {
    return 'Date must be in the future';
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}

// Valid coordinates validation
@ValidatorConstraint({ name: 'isValidCoordinates', async: false })
export class IsValidCoordinatesConstraint implements ValidatorConstraintInterface {
  validate(coordinates: { latitude: number; longitude: number }, args: ValidationArguments) {
    if (!coordinates || typeof coordinates !== 'object') return false;
    const { latitude, longitude } = coordinates;
    
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  defaultMessage(args: ValidationArguments) {
    return 'Coordinates must be valid latitude (-90 to 90) and longitude (-180 to 180)';
  }
}

export function IsValidCoordinates(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCoordinatesConstraint,
    });
  };
}

// Category validation - must exist and match listing type
@Injectable()
@ValidatorConstraint({ name: 'isValidCategory', async: true })
export class IsValidCategoryConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(ListingCategory)
    private readonly categoryRepository: Repository<ListingCategory>,
  ) {}

  async validate(categoryId: number, args: ValidationArguments) {
    if (!categoryId || typeof categoryId !== 'number') return false;
    
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    
    if (!category) return false;
    
    // Get the listing type from the object
    const object = args.object as any;
    const listingType = object.listingType;
    
    // If listing type is provided, validate it matches
    if (listingType && category.listingType !== listingType) {
      return false;
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Category must exist and match the listing type';
  }
}

export function IsValidCategory(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCategoryConstraint,
    });
  };
}

// Salary range validation
@ValidatorConstraint({ name: 'isValidSalaryRange', async: false })
export class IsValidSalaryRangeConstraint implements ValidatorConstraintInterface {
  validate(salary: { min?: number; max?: number }, args: ValidationArguments) {
    if (!salary || typeof salary !== 'object') return true; // Allow null/undefined
    
    const { min, max } = salary;
    
    // Both must be positive if provided
    if (min !== undefined && (typeof min !== 'number' || min < 0)) return false;
    if (max !== undefined && (typeof max !== 'number' || max < 0)) return false;
    
    // Max must be greater than or equal to min
    if (min !== undefined && max !== undefined && max < min) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Salary range must have valid min/max values where max >= min';
  }
}

export function IsValidSalaryRange(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSalaryRangeConstraint,
    });
  };
}

// Skills array validation
@ValidatorConstraint({ name: 'isValidSkillsArray', async: false })
export class IsValidSkillsArrayConstraint implements ValidatorConstraintInterface {
  validate(skills: string[], args: ValidationArguments) {
    if (!skills) return true; // Allow null/undefined
    
    if (!Array.isArray(skills)) return false;
    
    // All skills must be non-empty strings
    return skills.every(skill => typeof skill === 'string' && skill.trim().length > 0);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Skills must be an array of non-empty strings';
  }
}

export function IsValidSkillsArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSkillsArrayConstraint,
    });
  };
}

// Property size validation
@ValidatorConstraint({ name: 'isValidPropertySize', async: false })
export class IsValidPropertySizeConstraint implements ValidatorConstraintInterface {
  validate(size: number, args: ValidationArguments) {
    if (size === undefined || size === null) return true; // Allow null/undefined
    
    return typeof size === 'number' && size > 0 && size <= 10000; // Max 10,000 sqm
  }

  defaultMessage(args: ValidationArguments) {
    return 'Property size must be a positive number not exceeding 10,000 square meters';
  }
}

export function IsValidPropertySize(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPropertySizeConstraint,
    });
  };
}

// Service radius validation
@ValidatorConstraint({ name: 'isValidServiceRadius', async: false })
export class IsValidServiceRadiusConstraint implements ValidatorConstraintInterface {
  validate(radius: number, args: ValidationArguments) {
    if (radius === undefined || radius === null) return true; // Allow null/undefined
    
    return typeof radius === 'number' && radius > 0 && radius <= 200; // Max 200km
  }

  defaultMessage(args: ValidationArguments) {
    return 'Service radius must be a positive number not exceeding 200 kilometers';
  }
}

export function IsValidServiceRadius(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidServiceRadiusConstraint,
    });
  };
}

// Response time validation
@ValidatorConstraint({ name: 'isValidResponseTime', async: false })
export class IsValidResponseTimeConstraint implements ValidatorConstraintInterface {
  validate(time: number, args: ValidationArguments) {
    if (time === undefined || time === null) return true; // Allow null/undefined
    
    return typeof time === 'number' && time > 0 && time <= 168; // Max 1 week (168 hours)
  }

  defaultMessage(args: ValidationArguments) {
    return 'Response time must be a positive number not exceeding 168 hours (1 week)';
  }
}

export function IsValidResponseTime(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidResponseTimeConstraint,
    });
  };
}

// Nigerian phone number validation
@ValidatorConstraint({ name: 'isNigerianPhoneNumber', async: false })
export class IsNigerianPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phoneNumber: string, args: ValidationArguments) {
    if (!phoneNumber) return true; // Allow null/undefined
    
    // Nigerian phone number patterns
    const patterns = [
      /^\+234[789][01]\d{8}$/, // +234 format
      /^0[789][01]\d{8}$/, // 0 format
      /^234[789][01]\d{8}$/, // 234 format
    ];
    
    return patterns.some(pattern => pattern.test(phoneNumber));
  }

  defaultMessage(args: ValidationArguments) {
    return 'Phone number must be a valid Nigerian phone number';
  }
}

export function IsNigerianPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNigerianPhoneNumberConstraint,
    });
  };
}

// URL validation
@ValidatorConstraint({ name: 'isValidUrl', async: false })
export class IsValidUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (!url) return true; // Allow null/undefined
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Must be a valid URL';
  }
}

export function IsValidUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidUrlConstraint,
    });
  };
}
