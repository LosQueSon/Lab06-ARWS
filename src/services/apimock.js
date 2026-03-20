const db = [
  {
    author: 'john',
    name: 'house',
    points: [
      { x: 10, y: 10 },
      { x: 120, y: 10 },
      { x: 120, y: 90 },
      { x: 10, y: 90 },
      { x: 10, y: 10 },
    ],
  },
  {
    author: 'john',
    name: 'tree',
    points: [
      { x: 50, y: 130 },
      { x: 70, y: 80 },
      { x: 90, y: 130 },
      { x: 50, y: 130 },
    ],
  },
  {
    author: 'maria',
    name: 'road',
    points: [
      { x: 10, y: 200 },
      { x: 80, y: 170 },
      { x: 150, y: 200 },
    ],
  },
]

const clone = (value) => JSON.parse(JSON.stringify(value))

const apimock = {
  async getAll() {
    return clone(db)
  },

  async getByAuthor(author) {
    return clone(db.filter((bp) => bp.author === author))
  },

  async getByAuthorAndName(author, name) {
    const found = db.find((bp) => bp.author === author && bp.name === name)
    if (!found) {
      throw new Error('Blueprint not found')
    }
    return clone(found)
  },

  async create(payload) {
    db.push(clone(payload))
    return clone(payload)
  },
}

export default apimock