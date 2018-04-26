const {Validator} = require('@goldix.org/validator');
const {Type} = require('./Type');


const allTypes = {};

class CompositeType {
  
  /**
   * @param typeName
   * @param values
   * @param schema
   * @param options
   */
  
  constructor({typeName, values, schema, ...options}) {
    this.typeName = typeName;
    this.state = {};
    this.options = {
      ...options
    };
    this.schema = {
      ...schema
    };
    if (values && typeof values === 'object') {
      this.set(values);
    }
  }
  
  set(values) {
    for (let attr in values) {
      let val = values[attr];
      let attrSchema = this.schema[attr];
      if (!attrSchema) {
        if (!this.options.strict) {
          this.state[attr] = val;
        }
        continue;
      }
      if (val instanceof Type) {
        val = val.value;
      }
      this.state[attr] = Type.from(attrSchema.Type, val, attrSchema);
    }
  }
  
  toJSON({validate}) {
    let attributes = {};
    let constraints = {};
    for (let attr in this.state) {
      let val = this.state[attr];
      if (val instanceof Type) {
        validate && (constraints[attr] = val.getConstraints());
        val = val.value;
      }
      attributes[attr] = val;
    }
    
    if (validate) {
      return Validator.validate(attributes, constraints);
    }
    
    return Promise.resolve(attributes);
  }
}

/**
 *
 * @param {string}        typeName
 * @param {object}        primaryType
 * @param {boolean}       required
 * @param {any}           defaultValue
 * @param {boolean}       multiple
 * @param {string,regexp} separator   if separator defined and CompositeType value is string and multiple=true,
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

CompositeType.define = ({typeName, schema}) => {
  
  if (allTypes.hasOwnProperty(typeName)) {
    throw Error(`CompositeType error: CompositeType "${typeName}" already exists`);
  }
  
  allTypes[typeName] = {
    typeName, schema
  }
};

CompositeType.clone = ({oldTypeName, newTypeName, schema}) => {
  
  if (typeof oldTypeName !== 'string') {
    throw Error(`CompositeType clone error: Option "oldTypeName" is required and must be string`);
  }
  
  if (!allTypes.hasOwnProperty(oldTypeName)) {
    throw Error(`CompositeType clone error: CompositeType "${oldTypeName}" undefined`);
  }
  
  if (typeof newTypeName !== 'string') {
    throw Error(`CompositeType clone error: Option "newTypeName" is required and must be string`);
  }
  
  let base = allTypes[oldTypeName];
  
  CompositeType.define({
    ...base,
    typeName: newTypeName,
    schema,
  });
};

CompositeType.from = (typeName, values, options) => {
  
  if (!allTypes.hasOwnProperty(typeName)) {
    throw Error(`CompositeType error: CompositeType "${typeName}" undefined`);
  }
  
  options = {
    ...allTypes[typeName],
    ...options,
    values,
  };
  return new CompositeType(options);
};


module.exports = { CompositeType };
