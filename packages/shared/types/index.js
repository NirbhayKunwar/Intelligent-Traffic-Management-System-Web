/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} fullName
 * @property {string} role
 * @property {string} profilePic
 * @property {string[]} linkedProviders
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Camera
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string} stream
 * @property {string} status
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} modelHint
 * @property {string} previewUrl
 */

/**
 * @typedef {Object} Alert
 * @property {string} id
 * @property {string} type
 * @property {string} severity
 * @property {string} message
 * @property {boolean} active
 * @property {string} cameraId
 * @property {string} locationStr
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} timestamp
 */
export const TYPES_REFERENCE = {};
