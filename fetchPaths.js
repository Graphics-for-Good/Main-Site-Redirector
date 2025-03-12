import fs from 'fs'

import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom'

 
var template = fs.readFileSync('./astro.template', 'utf8')
var existingFiles = fs.readdirSync('./src/pages')

var nSite = 'https://graphics-for-good.wixsite.com/graphics-for-good'
var sitemap = `${nSite}/sitemap.xml`

async function fetchPaths() {
    var response = await fetch(sitemap)
    var text = await response.text()
    
    const parser = new XMLParser();
    const json = parser.parse(text);

    var nestedSitemaps = json.sitemapindex.sitemap

    existingFiles.forEach(file => {
        if (file !== '404.astro') {
            if (!fs.lstatSync(`./src/pages/${file}`).isDirectory()) {
                fs.unlinkSync(`./src/pages/${file}`)
            }
        }
    })

    nestedSitemaps.forEach(async nSitemap => {
        var siitemapLoc = nSitemap.loc
        var nResponse = await fetch(siitemapLoc)
        var nText = await nResponse.text()
        const nParser = new XMLParser();
        var nJson = nParser.parse(nText);

        var urls = nJson.urlset.url

        if (!Array.isArray(urls)) urls = [urls]

        urls.forEach(async url => {
            var path = url.loc

            var pageResponse = await fetch(path)
            var pText = await pageResponse.text()

            var pDom = new JSDOM(pText)
            var document = pDom.window.document
            var head = document.head

            var description = document.body.querySelector('.PAGES_CONTAINER')
            description.querySelectorAll('script, style, meta, link, :empty').forEach(e => e.remove())

            const $ = cheerio.load(description.innerHTML);
            description = $.text()
            description = description.replace(/[\n,\r,\r\n]+/g, ' ')
        
            var title = head.querySelector('title').textContent
            var icon = head.querySelector('link[rel="icon"]').href

            if (path.startsWith(nSite)) path = path.slice(nSite.length)
            if (path === '') path = '/index'
            if (path.startsWith('/')) path = path.slice(1)
            
            var nTemplate = template
            nTemplate = nTemplate.replace("var path = ''", `var path = "/${path === 'index' ? '' : path}"`)

            nTemplate = nTemplate.replace('</head>', `    <title>${title}</title>\n    <meta type="description" content="${description}" />\n    <link rel="icon" href="${icon}" />\n</head>`)


            var paths = []
            if (path.includes('/')) {
                paths = path.split('/')
                paths.pop()
            }
            var fPath = ''
            paths.forEach((p, i) => {
                if (i !== 0) fPath += '/'
                fPath += p

                if (!fs.existsSync(`./src/pages/${fPath}`)) {
                    fs.mkdirSync(`./src/pages/${fPath}`)
                }
            })

            fs.writeFileSync(`./src/pages/${path}.astro`, nTemplate)
        })
    })
}

export default fetchPaths