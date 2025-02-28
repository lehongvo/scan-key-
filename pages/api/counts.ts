import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const countScan = await prisma.countScan.findFirst();
      res.status(200).json(countScan);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  } else if (req.method === 'POST') {
    try {
      const { countNumber, transferCount } = req.body;
      const updatedCount = await prisma.countScan.upsert({
        where: { id: 1 },
        update: { countNumber, transferCount },
        create: { countNumber, transferCount },
      });
      res.status(200).json(updatedCount);
    } catch (error) {
      console.error('Failed to update data:', error);
      res.status(500).json({ error: 'Failed to update data' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}