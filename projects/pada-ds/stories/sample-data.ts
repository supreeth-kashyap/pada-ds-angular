/** Sample records for the data component stories, shaped like typical API responses. */

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Invited' | 'Suspended';
  commits: number;
  joined: string;
}

const firstNames = ['Ada', 'Grace', 'Linus', 'Margaret', 'Alan', 'Katherine', 'Dennis', 'Barbara', 'Ken', 'Frances', 'Edsger', 'Radia'];
const lastNames = ['Lovelace', 'Hopper', 'Torvalds', 'Hamilton', 'Turing', 'Johnson', 'Ritchie', 'Liskov', 'Thompson', 'Allen', 'Dijkstra', 'Perlman'];
const roles: Member['role'][] = ['Admin', 'Editor', 'Viewer'];
const statuses: Member['status'][] = ['Active', 'Active', 'Invited', 'Active', 'Suspended'];

/** A `GET /members` response: one page of items and the total. */
export const membersResponse: { items: Member[]; total: number } = {
  items: Array.from({ length: 36 }, (_, i) => {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[(i * 5) % lastNames.length];
    return {
      id: `m-${100 + i}`,
      name: `${first} ${last}`,
      email: `${first}.${last}@example.com`.toLowerCase(),
      role: roles[i % roles.length],
      status: statuses[i % statuses.length],
      commits: (i * 37) % 420,
      joined: new Date(Date.UTC(2024, i % 12, 1 + ((i * 7) % 27))).toISOString().slice(0, 10),
    };
  }),
  total: 36,
};
