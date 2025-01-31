// Google Analytics (GA4)
let gtagScript = document.createElement("script");
gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX";
gtagScript.async = true;
document.head.appendChild(gtagScript);
gtagScript.onload = function () {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag("js", new Date());
    gtag("config", "G-XXXXXXXXXX");
};

// Microsoft Clarity
let clarityScript = document.createElement("script");
clarityScript.innerHTML = `(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/YOUR_CLARITY_ID";
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "YOUR_CLARITY_ID");`;
document.head.appendChild(clarityScript);

/*
 // Facebook Pixel
let fbScript = document.createElement("script");
fbScript.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'YOUR_FACEBOOK_PIXEL_ID');
    fbq('track', 'PageView');`;
document.head.appendChild(fbScript);
*/
