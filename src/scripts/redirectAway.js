async function redirectAway() {
    const locResp = await fetch('https://ipapi.co/json/')
    if (locResp.status === 429) console.log(locResp.statusText)
    if (locResp.ok) {
        const locJson = await locResp.json()

        
        const continent_code = locJson.continent_code
        const country_code = locJson.country_code
        const region_code = locJson.region_code
        const city = locJson.city
        
        console.log(continent_code, country_code, region_code, city)

        if (continent_code === 'NA' && country_code === 'US' && region_code === 'VA' && city === 'Ashburn') return true
    }

    return false
}

export default redirectAway