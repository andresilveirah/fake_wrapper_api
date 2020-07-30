const geolookup = require('./geolookup')

describe('geolookup', () => {
  it('returns EUR for an european IP', async () => {
    expect(await geolookup('77.185.42.223')).toEqual('EUR')
  })

  it('returns US for an american IP', async () => {
    expect(await geolookup('198.181.163.183')).toEqual('US')
  })

  it('returns Unknown for any other IP', async () => {
    // Indian IP. NOTICE: I've experimented with an Brazilian IP and the
    // lookup API returned "Amsterdam" proving not to be the most reliable
    // geolocation API.
    expect(await geolookup('103.221.233.53')).toEqual('Unknown')
  })

  it('returns Unknown for a bogus ip', async () => {
    expect(await geolookup('foo')).toEqual('Unknown')
  })
})
