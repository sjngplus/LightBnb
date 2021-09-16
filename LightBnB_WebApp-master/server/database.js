const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  // let user;
  // for (const userId in users) {
  //   user = users[userId];
  //   if (user.email.toLowerCase() === email.toLowerCase()) {
  //     break;
  //   } else {
  //     user = null;
  //   }
  // }
  // return Promise.resolve(user);

  return pool.query(
    `
    SELECT users.*
    FROM users
    WHERE email = $1;
    `, [email.toLowerCase()]
  )
  .then((result) => {
    if (!result.rows[0]) return null;
    return result.rows[0];
  })
  .catch((err) => {
    console.log("##-->Query Error:", err.message);
  });
  
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {

  // return Promise.resolve(users[id]);

  return pool.query (
    `
    SELECT users.*
    FROM users
    WHERE id = $1;
    `, [id]
  )
  .then((result) => {    
    if (!result.rows[0]) return null;
    return result.rows[0];
  })
  .catch((err) => {
    console.log("##-->Query Error:", err.message);
  });

}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {

  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);

  return pool.query (
    `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
    `, [user.name, user.email, user.password]
  )
  .then((result) => {    
     return result.rows[0];
  })
  .catch((err) => {
    console.log("##-->Query Error:", err.message);
  });

}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {

  // return getAllProperties(null, 2);

  return pool.query (
    `
    SELECT reservations.*, properties.*, AVG(property_reviews.rating) AS average_rating
    FROM reservations
    JOIN users ON users.id = reservations.guest_id
    JOIN properties ON properties.id = reservations.property_id
    JOIN property_reviews ON property_reviews.property_id = properties.id
    WHERE reservations.guest_id = $1
    GROUP BY reservations.id, properties.id
    LIMIT $2;
    `, [guest_id, limit]
  )
  .then((result) => {        
    return result.rows;
  })
  .catch((err) => {
    console.log("##-->Query Error:", err.message);
  });

}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {  
  
  let queryParams = [limit];
  let queryHaving = "";

  let queryString = `
  SELECT properties.*, AVG(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON property_reviews.property_id = properties.id`;
  
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `
    WHERE properties.owner_id = $${queryParams.length}`
  }
  
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `
    WHERE properties.city ILIKE $${queryParams.length}`
  };
  
  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += `
    AND properties.cost_per_night > $${queryParams.length}`
  }
  
  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `
    AND properties.cost_per_night < $${queryParams.length}`
  };
  

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryHaving = `
    HAVING AVG(property_reviews.rating) > $${queryParams.length}`
  };

  
  //Test console.logs
  console.log(options);
  console.log(queryParams);  
  console.log(`
    ${queryString}
    GROUP BY properties.id
    ${queryHaving}
    LIMIT $1
  `);

  return pool.query(`
    ${queryString}
    GROUP BY properties.id
    ${queryHaving}
    LIMIT $1
    `, queryParams
  )
  .then((result) => {      
    return result.rows;
  })
  .catch((err) => {
    console.log("##-->Query Error:", err.message);
  });
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {

  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
  
}
exports.addProperty = addProperty;
