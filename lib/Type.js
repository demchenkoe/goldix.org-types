const {Validator} = require('@goldix.org/validator');


const allTypes = {};
const primaryType = ['string', 'number', 'boolean', 'object', 'array', 'function', 'any'];

class Type {
  
  /**
   * @param typeName
   * @param attributeName
   * @param value
   * @param options
   */
  
  constructor({typeName, attributeName, value, constraints, ...options}) {
    this.typeName = typeName;
    this.attributeName = attributeName;
    this.state = {};
    this.options = {
      ...options
    };
    this.constraints = {
      ...constraints
    };
    if (typeof value !== 'undefined') {
      this.value = value;
    }
  }
  
  get value() {
    if (this.state.hasOwnProperty('modified')) {
      return this.state.modified;
    }
    if (this.state.hasOwnProperty('value') && typeof this.state.value !== 'undefined') {
      return this.state.value;
    }
    
    return 'defaultValue' in this.options ? this.options.defaultValue : this.state.value;
  }
  
  set value(value) {
    delete this.state.modified;
    this.state.value = value;
    return this.transform();
  }
  
  get modified() {
    return this.state.modified;
  }
  
  set modified(value) {
    return this.state.modified = value;
  }
  
  typecasting(type, value, options = {}) {
    switch (type) {
      case 'number':
        return value * 1;
        break;
      case 'boolean':
        if (Array.isArray(options.trueValues)) {
          return options.trueValues.indexOf(value) !== -1
        } else {
          return !!value;
        }
      default:
        return value;
    }
  }
  
  transform() {
    if (this.hasOwnProperty('modified')) return;
    let {primaryType, defaultValue, multiple, separator, typecasting} = this.options;
    if (typeof this.value === 'undefined') {
      this.modified = defaultValue;
    }
    
    if (separator && multiple && typeof this.value === 'string') {
      this.modified = this.value.split(separator);
    }
    
    if (typecasting !== false) {
      if (multiple && Array.isArray(this.value)) {
        this.modified = this.value.map(value => this.typecasting(primaryType, value))
      } else {
        this.modified = this.typecasting(primaryType, this.value, typecasting);
      }
    }
  }
  
  getConstraints() {
    
    let auto = {
      presence: !!this.options.required,
    };
    if (Array.isArray(this.options.enum)) {
      auto.enum = {
        within: this.options.enum,
        multiple: this.options.multiple
      };
    }
    
    return {
      ...this.constraints,
      ...auto,
    };
  }
}

Type.get = (typeName) => {
  return allTypes[typeName];
};

/**
 *
 * @param {string}        typeName
 * @param {object}        primaryType
 * @param {boolean}       required
 * @param {any}           defaultValue
 * @param {boolean}       multiple
 * @param {string,regexp} separator   if separator defined and type value is string and multiple=true,
 *                                       then call value.split(separator)
 *
 * @param {object}        typecasting setup to "false" for disable typecasting
 * @param {array}         typecasting.trueValues
 * @param {enum}          validate: false | 'sync' | 'async'
 *
 * @param {object} constraints      validator.js constraints
 * @param {object} constraints.inclusion
 * @param {object} constraints.exclusion
 * @param {object} constraints.format
 * @param {object} constraints.numericality
 * @param {object} constraints.url
 * @param {object} constraints.length
 * @param {object} constraints.date
 * @param {object} constraints.datetime
 */

Type.define = ({typeName, constraints, ...options}) => {
  
  if (allTypes.hasOwnProperty(typeName)) {
    throw Error(`Type error: type "${typeName}" already exists`);
  }
  if (primaryType.indexOf(options.primaryType) === -1) {
    throw Error(`Type error: invalid primary type`);
  }
  
  allTypes[typeName] = {
    typeName, constraints, ...options
  }
};

Type.clone = ({oldTypeName, newTypeName, constraints, ...options}) => {
  
  if (typeof oldTypeName !== 'string') {
    throw Error(`Type clone error: Option "oldTypeName" is required and must be string`);
  }
  
  if (!allTypes.hasOwnProperty(oldTypeName)) {
    throw Error(`Type clone error: type "${oldTypeName}" undefined`);
  }
  
  if (typeof newTypeName !== 'string') {
    throw Error(`Type clone error: Option "newTypeName" is required and must be string`);
  }
  
  let base = allTypes[oldTypeName];
  
  Type.define({
    ...base,
    ...options,
    typeName: newTypeName,
    constraints: {...base.constraints, ...constraints},
  });
};

Type.from = (typeName, value, options) => {
  
  if (!allTypes.hasOwnProperty(typeName)) {
    throw Error(`Type error: undefined type "${typeName}"`);
  }
  
  options = {
    ...allTypes[typeName],
    ...options,
    value,
  };
  return new Type(options);
};

Validator.extend('enum', function (value, options, key, attributes) {
  if (Array.isArray(options)) {
    options = {within: options};
  }
  let invalid = [];
  if (Array.isArray(value)) {
    if (!options.multiple) {
      return 'cannot be array';
    }
    for (let i = 0; i < value.length; i++) {
      options.within.indexOf(value[i]) === -1 && invalid.push(value[i]);
    }
  } else {
    options.within.indexOf(value) === -1 && invalid.push(value);
  }
  
  if (invalid.length) {
    if (invalid.length > 5) {
      return `contain invalid values "${invalid.slice(0, 3).join('","')}",... and other ${invalid.length - 3} `
    } else if (invalid.length > 1) {
      return `contain invalid values "${invalid.join('","')}"`
    } else {
      return `contain invalid value "${invalid[0]}"`
    }
  }
  
  return null;
});

Type.define({typeName: 'number', primaryType: 'number'});
Type.define({typeName: 'string', primaryType: 'string'});
Type.define({typeName: 'boolean', primaryType: 'boolean'});
Type.define({typeName: 'object', primaryType: 'object'});
Type.define({typeName: 'array', primaryType: 'array'});
Type.define({typeName: 'function', primaryType: 'function'});
Type.define({typeName: 'any', primaryType: 'any'});

module.exports = {Type};
