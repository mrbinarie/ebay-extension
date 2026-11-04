// https://bankofgeorgia.ge/en/currencies

class App {
    dollarRate = 0;

    constructor() {
        let _this = this;
        chrome.storage.local.get(["lari_in_dollar"]).then((result) => {
            _this.dollarRate = result.lari_in_dollar;
            _this.addCurrency();
        });

        chrome.runtime.onMessage.addListener(function(request, sender) {
            if(!sender.tab) {
                _this.dollarRate = request.greeting;
                $('[data-ebay-gel-converted], .converted-price').remove();
                _this.addCurrency();
            }
        });

        console.log('eBay Converter Activated...');
    }

    addCurrency(root = document) {
        let _this = this;
        const hasCurrency = element => /\$/.test(element.textContent || '');
        const hasDirectPrice = element => Array.from(element.childNodes).some(node =>
            node.nodeType === Node.TEXT_NODE && /\$\s*\d[\d.,]*/.test(node.nodeValue || '')
        );
        let scanRoot = $(root);
        let priceBox = scanRoot.find('*').addBack().filter(function() {
            return hasDirectPrice(this) && !Array.from(this.children).some(hasCurrency);
        });
        $.each(priceBox, function(key, element) {
            let priceElement = $(element);
            let price = _this.priceConverter(element.innerText || '');
            if(price === null) {
                return;
            }
            if(priceElement.find('[data-ebay-gel-converted]').length === 0) {
                const convertedPrice = $('<span></span>')
                    .attr('data-ebay-gel-converted', '')
                    .text(' (' + price + ')')
                    .css({
                        'font-weight': 'normal',
                        'font-size': '.875rem'
                    });
                priceElement.append(convertedPrice);
            }
        });
    }

    priceConverter(price) {
        let _this = this;
        const priceMatch = price.match(/\d[\d.,]*/);
        const exchangeRate = Number(_this.dollarRate);
        if(!priceMatch || !/\$/.test(price) || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
            return null;
        }
        let toLari = priceMatch[0].replace(/[\.,](?=\d{3})/g, '');
        toLari = parseFloat(toLari);
        if(!Number.isFinite(toLari) || toLari <= 0) {
            return null;
        }
        toLari *= exchangeRate;
        const convertedAmount = toLari.toFixed(0);
        if(toLari > 300) {
            const totalAmount = (toLari * 1.2).toFixed(0);
            return `${totalAmount} ₾ | ${convertedAmount} ₾`;
        }
        return `${convertedAmount} ₾`;
    }

}

let app = new App();