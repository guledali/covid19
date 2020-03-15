import { useState, useEffect } from 'react'
import Spinner from 'respin'
import Settings from 'src/components/Settings'
import Stat from 'src/components/StatsCell/Stat'
import StatChart from 'src/components/StatsCell/StatChart'
import commaNumber from 'comma-number'
import { map, find, last, trim } from 'lodash'

export const QUERY = gql`
  query {
    countries {
      iso
      name
      dailyCounts {
        currentlyInfected
        totalCases
        totalDeaths
      }
    }
  }
`

export const Loading = () => <Spinner />

export const Empty = () => <div>No stats found</div>

export const Failure = ({ error }) => (
  <div>
    Error: <pre>{error.message}</pre>
  </div>
)

// The IPInfo service uses 2-letter codes :(
// Hardcoding switching these over to the 3-letter codes our database uses
const list = {
  GB: 'gbr',
  US: 'usa',
  DE: 'deu',
  ES: 'esp',
  KR: 'kor',
  IT: 'itl',
  CN: 'chn',
  IR: 'irn'
}

export const Success = ({ countries = [] }) => {
  const [country, setCountry] = useState('usa')
  const changeCountry = ({ target: { value } }) => setCountry(value)

  // Automatically set country
  useEffect(() => {
    fetch('https://ipinfo.io/country?token=44ae4f170b445a')
      .then((r) => r.text())
      .then((t) => trim(t))
      .then((co) => {
        // If you’re in a country our database represents
        if (Object.keys(list).includes(co)) setCountry(list[co])
      })
  }, [])

  // Calculate stats
  const [counts, setCounts] = useState([])
  const stat = (key) => commaNumber(last(map(counts, key).sort()))
  const statChart = (key) => map(counts, key)
  useEffect(() => {
    setCounts(find(countries, ['iso', country])?.dailyCounts)
  }, [country])

  return (
    <>
      <Settings>
        <h2>Live stats</h2>
        <label htmlFor="country">Select country</label>
        <select name="country" value={country} onChange={changeCountry}>
          {countries.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.name}
            </option>
          ))}
        </select>
      </Settings>
      <article>
        <section>
          <Stat value={stat('currentlyInfected')} label="Currently infected" />
          <StatChart data={counts} dataKey="currentlyInfected" color="green" />
        </section>
        <section>
          <Stat value={stat('totalCases')} label="Total cases" />
          <StatChart data={counts} dataKey="totalCases" color="orange" />
        </section>
        <section>
          <Stat value={stat('totalDeaths')} label="Total deaths" />
          <StatChart data={counts} dataKey="totalDeaths" color="red" />
        </section>
      </article>
      <style jsx>{`
        article {
          display: grid;
          grid-gap: 1rem;
          grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
        }
        article section {
          position: relative;
        }
        article section :global(.recharts-responsive-container) {
          position: absolute !important;
          bottom: 0;
          left: 0;
          right: 0;
        }
      `}</style>
    </>
  )
}