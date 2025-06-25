import fs from 'fs'
import fetch from 'node-fetch'

import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom'

 
var template = fs.readFileSync('./src/pages/_template.astro', 'utf-8')
var filesExist = fs.existsSync('./src/pages')

var nSite = 'https://graphics-for-good.wixsite.com/graphics-for-good'
var fName = 'sitemap.xml'
var sitemap = `${nSite}/${fName}`

async function fetchSiteMap(path, name) {
    var response = await fetch(path)
    var text = await response.text()
    
    fs.writeFileSync(`./public/${name}`, text)

    const parser = new XMLParser();
    const json = parser.parse(text);

    return json
}

async function fetchPaths() {
    const json = await fetchSiteMap(sitemap, fName)
    var nestedSitemaps = json.sitemapindex.sitemap

    nestedSitemaps.forEach(async nSitemap => {
        var nSitemapLoc = nSitemap.loc
        var sitemapName = nSitemapLoc

        if (sitemapName.startsWith(nSite)) sitemapName = sitemapName.slice(nSite.length)
        
        const nJson = await fetchSiteMap(nSitemapLoc, sitemapName)

        var urls = nJson.urlset.url

        if (!Array.isArray(urls)) urls = [urls]

        urls.forEach(async url => {
            var path = url.loc

            var pageResponse = await fetch(path)
            var pText = await pageResponse.text()

            var pDom = new JSDOM(pText)
            var document = pDom.window.document
            var head = document.head

            var description = ''
            var description = document.body.querySelector('.PAGES_CONTAINER');
            description.querySelectorAll('script, style, meta, link, :empty').forEach(e => e.remove());
            description = description.textContent;
            description = description.replaceAll('\n', ' ').replaceAll('\r', ' ').replace(/[\n,\r,\r\n]+/g, ' ');
            while (description.includes('  ')) description = description.replaceAll('  ', ' ');
        
            var title = head.querySelector('title').textContent
            var icon = head.querySelector('link[rel="icon"]').href

            if (path.startsWith(nSite)) path = path.slice(nSite.length)
            if (path === '') path = '/index'
            if (path.startsWith('/')) path = path.slice(1)
            
            var nTemplate = template
            nTemplate = nTemplate.replace("var path = ''", `var path = '/${path === "index" ? "" : path}'`)

            nTemplate = nTemplate.replace('</head>', `    <title>${title}</title>\n    <meta name="description" content={\`${description}\`} />\n    <link rel="icon" href="${icon}" />\n</head>`)


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

            if (filesExist && fs.existsSync(`./src/pages/${path}`) && !fs.lstatSync(`./src/pages/${path}`).isDirectory()) {
                fs.unlinkSync(`./src/pages/${path}`)
            }

            fs.writeFileSync(`./src/pages/${path}.astro`, nTemplate)
        })
    })
}

fetchPaths()

function callDone() {return 'ran'}

export default callDone