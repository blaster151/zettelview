import { useState, useCallback } from 'react';

export interface ValidationRule<T> {
  validate: (value: T) => ValidationResult;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationSchema<T> {
  [K in keyof T]?: ValidationRule<T[K]>[];
}

// Basic validation rules
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule<any> => ({
    validate: (value) => ({
      isValid: value !== null && value !== undefined && value !== '',
      message
    }),
    message
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => ({
      isValid: typeof value === 'string' && value.length >= min,
      message: message || `Must be at least ${min} characters long`
    }),
    message: message || `Must be at least ${min} characters long`
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => ({
      isValid: typeof value === 'string' && value.length <= max,
      message: message || `Must be no more than ${max} characters long`
    }),
    message: message || `Must be no more than ${max} characters long`
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value) => ({
      isValid: typeof value === 'string' && regex.test(value),
      message
    }),
    message
  }),

  email: (message = 'Must be a valid email address'): ValidationRule<string> => ({
    validate: (value) => ({
      isValid: typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message
    }),
    message
  }),

  url: (message = 'Must be a valid URL'): ValidationRule<string> => ({
    validate: (value) => {
      try {
        new URL(value);
        return { isValid: true };
      } catch {
        return { isValid: false, message };
      }
    },
    message
  }),

  number: (message = 'Must be a valid number'): ValidationRule<any> => ({
    validate: (value) => ({
      isValid: !isNaN(Number(value)) && value !== '',
      message
    }),
    message
  }),

  integer: (message = 'Must be a valid integer'): ValidationRule<any> => ({
    validate: (value) => ({
      isValid: Number.isInteger(Number(value)) && value !== '',
      message
    }),
    message
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => ({
      isValid: typeof value === 'number' && value >= min,
      message: message || `Must be at least ${min}`
    }),
    message: message || `Must be at least ${min}`
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => ({
      isValid: typeof value === 'number' && value <= max,
      message: message || `Must be no more than ${max}`
    }),
    message: message || `Must be no more than ${max}`
  }),

  range: (min: number, max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => ({
      isValid: typeof value === 'number' && value >= min && value <= max,
      message: message || `Must be between ${min} and ${max}`
    }),
    message: message || `Must be between ${min} and ${max}`
  }),

  date: (message = 'Must be a valid date'): ValidationRule<any> => ({
    validate: (value) => {
      const date = new Date(value);
      return {
        isValid: !isNaN(date.getTime()),
        message
      };
    },
    message
  }),

  futureDate: (message = 'Must be a future date'): ValidationRule<any> => ({
    validate: (value) => {
      const date = new Date(value);
      return {
        isValid: !isNaN(date.getTime()) && date > new Date(),
        message
      };
    },
    message
  }),

  pastDate: (message = 'Must be a past date'): ValidationRule<any> => ({
    validate: (value) => {
      const date = new Date(value);
      return {
        isValid: !isNaN(date.getTime()) && date < new Date(),
        message
      };
    },
    message
  }),

  array: (message = 'Must be an array'): ValidationRule<any> => ({
    validate: (value) => ({
      isValid: Array.isArray(value),
      message
    }),
    message
  }),

  arrayLength: (length: number, message?: string): ValidationRule<any[]> => ({
    validate: (value) => ({
      isValid: Array.isArray(value) && value.length === length,
      message: message || `Must have exactly ${length} items`
    }),
    message: message || `Must have exactly ${length} items`
  }),

  arrayMinLength: (min: number, message?: string): ValidationRule<any[]> => ({
    validate: (value) => ({
      isValid: Array.isArray(value) && value.length >= min,
      message: message || `Must have at least ${min} items`
    }),
    message: message || `Must have at least ${min} items`
  }),

  arrayMaxLength: (max: number, message?: string): ValidationRule<any[]> => ({
    validate: (value) => ({
      isValid: Array.isArray(value) && value.length <= max,
      message: message || `Must have no more than ${max} items`
    }),
    message: message || `Must have no more than ${max} items`
  }),

  object: (message = 'Must be an object'): ValidationRule<any> => ({
    validate: (value) => ({
      isValid: typeof value === 'object' && value !== null && !Array.isArray(value),
      message
    }),
    message
  }),

  custom: <T>(validator: (value: T) => ValidationResult): ValidationRule<T> => ({
    validate: validator,
    message: 'Validation failed'
  })
};

// Note-specific validation rules
export const NoteValidationRules = {
  title: (message = 'Note title is required'): ValidationRule<string> => ({
    validate: (value) => ({
      isValid: typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 200,
      message: message || 'Note title must be between 1 and 200 characters'
    }),
    message: message || 'Note title must be between 1 and 200 characters'
  }),

  body: (message = 'Note body is required'): ValidationRule<string> => ({
    validate: (value) => ({
      isValid: typeof value === 'string' && value.trim().length > 0 && value.length <= 100000,
      message: message || 'Note body must be between 1 and 100,000 characters'
    }),
    message: message || 'Note body must be between 1 and 100,000 characters'
  }),

  tags: (message = 'Invalid tags format'): ValidationRule<string[]> => ({
    validate: (value) => {
      if (!Array.isArray(value)) {
        return { isValid: false, message };
      }
      
      for (const tag of value) {
        if (typeof tag !== 'string' || tag.trim().length === 0 || tag.length > 50) {
          return { 
            isValid: false, 
            message: 'Each tag must be a non-empty string with maximum 50 characters' 
          };
        }
      }
      
      return { isValid: true };
    },
    message
  }),

  tagCount: (max: number, message?: string): ValidationRule<string[]> => ({
    validate: (value) => ({
      isValid: Array.isArray(value) && value.length <= max,
      message: message || `Cannot have more than ${max} tags`
    }),
    message: message || `Cannot have more than ${max} tags`
  }),

  noDuplicateTags: (message = 'Duplicate tags are not allowed'): ValidationRule<string[]> => ({
    validate: (value) => {
      if (!Array.isArray(value)) return { isValid: false, message };
      
      const uniqueTags = new Set(value.map(tag => tag.toLowerCase()));
      return {
        isValid: uniqueTags.size === value.length,
        message
      };
    },
    message
  })
};

// Validation functions
export function validateField<T>(
  value: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  for (const rule of rules) {
    const result = rule.validate(value);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}

export function validateObject<T>(
  data: T,
  schema: ValidationSchema<T>
): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    if (rules) {
      const value = (data as any)[field];
      const result = validateField(value, rules);
      
      if (!result.isValid) {
        errors.push({
          field,
          message: result.message || 'Validation failed',
          code: result.code || 'VALIDATION_ERROR',
          value
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Form validation hook
export function useFormValidation<T>(schema: ValidationSchema<T>) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Set<keyof T>>(new Set());

  const validate = useCallback((data: T): boolean => {
    const result = validateObject(data, schema);
    setErrors(result.errors);
    return result.isValid;
  }, [schema]);

  const validateField = useCallback((field: keyof T, value: any): boolean => {
    const fieldRules = schema[field];
    if (!fieldRules) return true;

    const result = validateFieldValue(value, fieldRules);
    
    setErrors(prev => {
      const newErrors = prev.filter(e => e.field !== field);
      if (!result.isValid) {
        newErrors.push({
          field: field as string,
          message: result.message || 'Validation failed',
          code: result.code || 'VALIDATION_ERROR',
          value
        });
      }
      return newErrors;
    });

    return result.isValid;
  }, [schema]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => new Set([...prev, field]));
  }, []);

  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return errors.find(e => e.field === field)?.message;
  }, [errors]);

  const isFieldTouched = useCallback((field: keyof T): boolean => {
    return touched.has(field);
  }, [touched]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  return {
    errors,
    touched,
    validate,
    validateField,
    setFieldTouched,
    getFieldError,
    isFieldTouched,
    clearErrors,
    clearFieldError
  };
}

// Note validation schemas
export const noteValidationSchema: ValidationSchema<{
  title: string;
  body: string;
  tags: string[];
}> = {
  title: [
    NoteValidationRules.title(),
    ValidationRules.maxLength(200, 'Title cannot exceed 200 characters')
  ],
  body: [
    NoteValidationRules.body(),
    ValidationRules.maxLength(100000, 'Note body cannot exceed 100,000 characters')
  ],
  tags: [
    NoteValidationRules.tags(),
    NoteValidationRules.tagCount(20, 'Cannot have more than 20 tags'),
    NoteValidationRules.noDuplicateTags()
  ]
};

export const templateValidationSchema: ValidationSchema<{
  name: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
}> = {
  name: [
    ValidationRules.required('Template name is required'),
    ValidationRules.minLength(1, 'Template name cannot be empty'),
    ValidationRules.maxLength(100, 'Template name cannot exceed 100 characters')
  ],
  description: [
    ValidationRules.maxLength(500, 'Description cannot exceed 500 characters')
  ],
  content: [
    ValidationRules.required('Template content is required'),
    ValidationRules.minLength(1, 'Template content cannot be empty'),
    ValidationRules.maxLength(50000, 'Template content cannot exceed 50,000 characters')
  ],
  category: [
    ValidationRules.required('Category is required'),
    ValidationRules.pattern(/^(general|project|meeting|research|personal|custom)$/, 'Invalid category')
  ],
  tags: [
    NoteValidationRules.tags(),
    NoteValidationRules.tagCount(10, 'Cannot have more than 10 tags'),
    NoteValidationRules.noDuplicateTags()
  ]
};

// Search validation
export const searchValidationSchema: ValidationSchema<{
  query: string;
  filters: any;
}> = {
  query: [
    ValidationRules.maxLength(1000, 'Search query cannot exceed 1000 characters')
  ],
  filters: [
    ValidationRules.object('Invalid filter format')
  ]
};

// Export validation
export const exportValidationSchema: ValidationSchema<{
  format: string;
  includeMetadata: boolean;
  includeTags: boolean;
  includeTimestamps: boolean;
}> = {
  format: [
    ValidationRules.required('Export format is required'),
    ValidationRules.pattern(/^(json|markdown|csv|pdf|html)$/, 'Invalid export format')
  ],
  includeMetadata: [
    ValidationRules.custom((value) => ({
      isValid: typeof value === 'boolean',
      message: 'Include metadata must be a boolean'
    }))
  ],
  includeTags: [
    ValidationRules.custom((value) => ({
      isValid: typeof value === 'boolean',
      message: 'Include tags must be a boolean'
    }))
  ],
  includeTimestamps: [
    ValidationRules.custom((value) => ({
      isValid: typeof value === 'boolean',
      message: 'Include timestamps must be a boolean'
    }))
  ]
};

// Import validation
export const importValidationSchema: ValidationSchema<{
  format: string;
  mergeStrategy: string;
  validateData: boolean;
}> = {
  format: [
    ValidationRules.required('Import format is required'),
    ValidationRules.pattern(/^(json|markdown)$/, 'Invalid import format')
  ],
  mergeStrategy: [
    ValidationRules.required('Merge strategy is required'),
    ValidationRules.pattern(/^(replace|merge|skip-duplicates)$/, 'Invalid merge strategy')
  ],
  validateData: [
    ValidationRules.custom((value) => ({
      isValid: typeof value === 'boolean',
      message: 'Validate data must be a boolean'
    }))
  ]
}; 