// lib/with-cors.js
import Cors from 'cors';
import initMiddleware from './init-middleware';
import { NextApiRequest, NextApiResponse } from 'next';

const cors = initMiddleware(
    Cors({
        origin: ['http://localhost:3000', "http://localhost:3001", "*"], // Add all allowed origins here
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    })
);

export function withCors(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        await cors(req, res);
        return handler(req, res);
    };
}
