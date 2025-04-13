import { siteConfig } from '@/lib/config'
import * as gtag from '@/lib/plugins/gtag'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
/**
 * Google Analytics
 * @returns
 */
const Gtag = () => {
  const router = useRouter()
  const ANALYTICS_GOOGLE_ID = siteConfig('ANALYTICS_GOOGLE_ID')
  useEffect(() => {
    const gtagRouteChange = url => {
      gtag.pageview(url, ANALYTICS_GOOGLE_ID)
    }
    router.events.on('routeChangeComplete', gtagRouteChange)
    return () => {
      router.events.off('routeChangeComplete', gtagRouteChange)
    }
  }, [router.events])
  return null
}
export default Gtag

<script data-cookieconsent="ignore">    window.dataLayer = window.dataLayer || [];    function gtag() {        dataLayer.push(arguments);    }    gtag("consent", "default", {        ad_personalization: "denied",        ad_storage: "denied",        ad_user_data: "denied",        analytics_storage: "denied",        functionality_storage: "denied",        personalization_storage: "denied",        security_storage: "granted",        wait_for_update: 500,    });    gtag("set", "ads_data_redaction", true);    gtag("set", "url_passthrough", false);</script>
