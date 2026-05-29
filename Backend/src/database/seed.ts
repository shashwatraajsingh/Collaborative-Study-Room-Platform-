import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { Room } from '../rooms/entities/room.entity';
import { RoomMember, RoomRole } from '../rooms/entities/room-member.entity';
import { Message } from '../messages/entities/message.entity';
import { StudySession } from '../sessions/entities/study-session.entity';

dotenv.config();

const BCRYPT_SALT_ROUNDS = 12;

async function seed(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env['DATABASE_URL'],
    entities: [User, Room, RoomMember, Message, StudySession],
    synchronize: true,
    logging: false,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await dataSource.initialize();
  console.log('Database connected for seeding.');

  const userRepo = dataSource.getRepository(User);
  const roomRepo = dataSource.getRepository(Room);
  const memberRepo = dataSource.getRepository(RoomMember);
  const messageRepo = dataSource.getRepository(Message);

  // --- Create Users ---
  const alicePassword = await bcrypt.hash('password123', BCRYPT_SALT_ROUNDS);
  const bobPassword = await bcrypt.hash('password456', BCRYPT_SALT_ROUNDS);

  const alice = await userRepo.save(
    userRepo.create({
      email: 'alice@studyroom.dev',
      username: 'alice',
      password: alicePassword,
    }),
  );
  console.log(`Created user: ${alice.username} (${alice.id})`);

  const bob = await userRepo.save(
    userRepo.create({
      email: 'bob@studyroom.dev',
      username: 'bob',
      password: bobPassword,
    }),
  );
  console.log(`Created user: ${bob.username} (${bob.id})`);

  // --- Create Room ---
  const room = await roomRepo.save(
    roomRepo.create({
      name: 'Algorithms Study Group',
      description: 'Prepare for coding interviews together. Focus on dynamic programming and graph algorithms.',
      ownerId: alice.id,
      inviteCode: 'ALGO2025',
      isActive: true,
    }),
  );
  console.log(`Created room: "${room.name}" (invite code: ${room.inviteCode})`);

  // --- Add Members ---
  await memberRepo.save(
    memberRepo.create({
      roomId: room.id,
      userId: alice.id,
      role: RoomRole.OWNER,
    }),
  );

  await memberRepo.save(
    memberRepo.create({
      roomId: room.id,
      userId: bob.id,
      role: RoomRole.MEMBER,
    }),
  );
  console.log('Added alice (owner) and bob (member) to the room.');

  // --- Create Sample Messages ---
  const sampleMessages = [
    { userId: alice.id, content: 'Hey everyone! Let\'s start with two-pointer problems today.' },
    { userId: bob.id, content: 'Sounds good! I was just reviewing sliding window techniques.' },
    { userId: alice.id, content: 'Perfect — those two are closely related. Want to pair up on LeetCode 76?' },
    { userId: bob.id, content: 'Yes! Give me 5 minutes to set up my environment.' },
    { userId: alice.id, content: 'Take your time. I\'ll share my approach once you\'re ready.' },
  ];

  for (const msg of sampleMessages) {
    await messageRepo.save(
      messageRepo.create({
        roomId: room.id,
        userId: msg.userId,
        content: msg.content,
      }),
    );
  }
  console.log(`Created ${sampleMessages.length} sample messages.`);

  // --- Summary ---
  console.log('\n--- Seed Complete ---');
  console.log(`Users: alice (${alice.email}), bob (${bob.email})`);
  console.log(`Passwords: alice=password123, bob=password456`);
  console.log(`Room: "${room.name}" (invite code: ${room.inviteCode})`);

  await dataSource.destroy();
  console.log('Database connection closed.');
}

seed().catch((error: unknown) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
