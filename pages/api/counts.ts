import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const countScan = await prisma.countScan.findFirst();
    res.json(countScan);
  } else if (req.method === 'POST') {
    const { countNumber, transferCount } = req.body;
    const updatedCount = await prisma.countScan.upsert({
      where: { id: 1 },
      update: { countNumber, transferCount },
      create: { countNumber, transferCount },
    });
    res.json(updatedCount);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
