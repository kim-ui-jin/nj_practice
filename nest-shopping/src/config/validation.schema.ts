import Joi from "joi";

export const envValidationSchema = Joi.object({
    APP_PORT: Joi.number().default(3000),
    DB_TYPE: Joi.string().valid('mysql').required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(3306),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().min(1).required(),
    DB_DATABASE: Joi.string().required(),
    DB_SYNC: Joi.boolean().truthy('true').falsy('false').default(false),
    DB_LOGGING: Joi.boolean().truthy('true').falsy('false').default(true),
    JWT_ACCESS_SECRET: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().required(),
});