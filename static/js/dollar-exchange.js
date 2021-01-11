// Global variables
const currencySearchInput = document.querySelector('#select-currency')
const amountToConvert = document.querySelector('#currency-field')
const currenciesDiv = document.querySelector('.other-currencies')
const summitCurrencyButton = document.querySelector('#summit-currency')
import CURRENCY_API_KEY from "./apikeys.js";
let  currentFocus

/****************************************************************************
 ***************** Functions to obtain the list of currencies****************
 ****************************************************************************/

 const getAllCurrencies = async () => {
    
    const response = await axios.get(`https://openexchangerates.org/api/currencies.json`)
    let currencies = Object.entries(response.data) 
    return currencies

}

const searchCurrenciesMatches = async searchText => {
    //Get the list of currencies from the localStorage
    let currencies = await getAllCurrencies()
    //Select the matches with a regex expression
    let matches = currencies.filter(currency => {
        const regex = new RegExp(`^${searchText}`,'gi')
        return currency[1].match(regex)
    })

    return matches
}


/****************************************************************************
 ***************** Search currency autocomplete *****************************
 ****************************************************************************/
function searchAutocomplete() {
      
    currencySearchInput.addEventListener('input',async function(e){
        let a, b, i, val = this.value
        closeAllList()

        if (!val) return false
        //Create a Div element that will contain the items (values)
        currentFocus = -1;
        a = document.createElement('div')
        a.setAttribute('id', `${this.id}-autocomplete-list`)
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a)
        //Get the matches
        const currenciesMatch = await searchCurrenciesMatches(this.value)   
        currenciesMatch.forEach(currency =>{
            b = document.createElement('div')
            b.innerHTML = `<span>[${currency[0]}] ${currency[1]}</span>`
            b.innerHTML += "<input type='hidden' value='[" + currency[0] + "] " + currency[1] + "'>";
            b.addEventListener('click', function(e) {
                currencySearchInput.value  = this.getElementsByTagName("input")[0].value
                closeAllList()
            })
            a.appendChild(b)
        })
        
    })

    function closeAllList(elem){
        let x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++){
            if(elem != x[i] && elem != currencySearchInput) x[i].parentNode.removeChild(x[i]) 
        }
    }

    function addActive(x) {
    /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    currencySearchInput.addEventListener('keydown', function(e){
        let x = document.getElementById(`${this.id}-autocomplete-list`)
        if (x) x = x.getElementsByTagName("div")
        switch(e.keyCode) {
            case 40:
                currentFocus++
                addActive(x)
                break
            case 38:
                currentFocus--
                addActive(x)
                break
            case 13:
                e.preventDefault();
                if (currentFocus > -1){
                    if (x) x[currentFocus].click()
                } 
                break

        }
    })

}

searchAutocomplete()

/****************************************************************************
 ************ Functions to get the Exchange Rate + Country Info *************
 ****************************************************************************/

 const getExchangeRate = async (fromCurrency, toCurrency) => {


    const response = await axios.get(`http://api.currencylayer.com/live?access_key=${CURRENCY_API_KEY}&currencies=${toCurrency}&source=${fromCurrency}&format=1`)
    const quotes =  response.data.quotes
    const quoteValues = Object.values(quotes)
    return quoteValues[0]
    
}

const getCountryWithCurrCode = async (currCode) =>{
    //if currency is EUR, The country is EU
    if (currCode === 'EUR') return ['EU', 'European Union']
    //Other Currencies get the country
    const resp = await axios.get(`https://restcountries.eu/rest/v2/currency/${currCode}`)
    console.log(resp.data[0].name)
    console.log(resp.data[0].alpha2Code)
    return [resp.data[0].alpha2Code,resp.data[0].name]
    
}

/****************************************************************************
 ******************* Function to render the Currency Info *******************
 ****************************************************************************/

 const renderCountry = (countryCode,currValue,showCurrValue,currCode,moneyToConvert,countryName) => {
    //create a country div
    let currencyContainer = document.querySelector('.other-currencies')
    let cardDiv, cardHeader, cardBody
    const divClasses = ['card','bg-light','mb-3','country']
    cardDiv = createDivElem(divClasses, currCode)
    //cardDiv.style.minWidth = ''
    cardHeader = createDivElem(['card-header'])
    cardBody = createDivElem(['card-body','calculation'])
    cardHeader.innerHTML = `<img src="https://www.countryflags.io/${countryCode}/flat/24.png" alt="countryflag"></img>`
    cardHeader.innerHTML += countryName
    cardHeader.innerHTML += `<p card-text><span value=${currValue} currency=${currCode}>${showCurrValue}</span></p>`
    cardBody.innerHTML = `<h4 class="card-title"></h4>`
    cardBody.innerHTML += `<button type="button" class="btn btn-outline-danger">Delete</button>`
    cardDiv.appendChild(cardHeader)
    cardDiv.appendChild(cardBody)
    currencyContainer.appendChild(cardDiv)

    function createDivElem(classes,id){
        const div = document.createElement('div')
        classes.forEach(elemClass => {
            div.classList.add(elemClass)
        })
        div.setAttribute('id',id) 
        return div
    }

    return cardDiv

}

/****************************************************************************
 ******************* Function to calculate Value enter by User **************
 ****************************************************************************/
function calculateExcValue() {
    
    amountToConvert.value = formatNumber(amountToConvert.value)
    const maxLenght = amountToConvert.getAttribute('max')
    let valueToConvert = amountToConvert.value   
    if (!valueToConvert)  valueToConvert = '1'
    valueToConvert = valueToConvert.replace(/\./g, '') 

    if (valueToConvert.length > maxLenght.length) {
        valueToConvert = valueToConvert.substr(0,maxLenght.length)
        amountToConvert.value = formatNumber(valueToConvert) 
        //console.log(valueToConvert)
    }

    const currencies = currenciesDiv.getElementsByClassName('country')
    for (let i = 0;i < currencies.length; i++){
        const valueInfoDiv = currencies[i].querySelector(".card-header")

        const ValueInfo = valueInfoDiv.getElementsByTagName('span')

        const currValue = ValueInfo[0].getAttribute('value')
        const currCode = ValueInfo[0].getAttribute('currency')

        let calculatedValue = parseFloat(valueToConvert) * parseFloat(currValue)

        const calculateDiv =    currencies[i].querySelector(".calculation")
          //console.log(calculateDiv)
        const calculateh4 = calculateDiv.getElementsByClassName('card-title')


        calculatedValue = new Intl.NumberFormat("de-DE", {style: "currency", currency: currCode}).format(calculatedValue)

        calculateh4[0].textContent = calculatedValue

        //reformatRenderValue(calculateSpan[0], buttonDiv)

    //        calculateSpan[1].textContent = currCode

    }
    
    function formatNumber(n) {
        // format number 1000000 to 1,234,567
        return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    }


}

function autoCalcValue(){
    amountToConvert.addEventListener('input', calculateExcValue)
}

autoCalcValue()

/****************************************************************************
 **************** Show the Currencies Exchange Rates and Value **************
 ****************************************************************************/

function showCurrency(){
     //Add functionality to delete button
    function deleteButtonAction(elem) {
        elem.addEventListener('click', function(){
            const currencyDiv = this.parentNode.parentNode

            for(let child=currencyDiv.firstChild; child!==null; child=child.nextSibling){        
                child.innerHTML = ''
                child.parentNode.removeChild(child)
            }
            currencyDiv.parentNode.removeChild(currencyDiv)
        })
    }
    
    summitCurrencyButton.addEventListener('click', async function(){
    
        function validateCurrencyNotRender(currCode){

            const currencies = currenciesDiv.getElementsByTagName('div')
            for (let i = 0;i < currencies.length; i++) {
                if (currencies[i].id === currCode) return false
            }

            return true
        }

        // Get the currency from input
        let currValue,currCode,moneyToConvert
        let notRender = validateCurrencyNotRender(currCode)
        currCode = await getCurrencyCode(this)

        if (notRender){

            moneyToConvert = ''
            const [countryCode,countryName]  = await getCountryWithCurrCode(currCode)
            currValue = await getExchangeRate('USD',currCode)   
            let showCurrValue = new Intl.NumberFormat("de-DE", {style: "currency", currency: currCode}).format(currValue)
            
            const a = renderCountry(countryCode,currValue,showCurrValue,currCode,moneyToConvert,countryName)
            const b = a.getElementsByClassName('btn-outline-danger')
            console.log(b)
            
            deleteButtonAction(b[0])
            //showLastMonthButton(c[0])
            // let countriesHeight = countriesDiv.offsetHeight
            // countriesDiv.scroll({
            //     top: countriesHeight,
            //     behavior: 'smooth'
            // })
            calculateExcValue()

        }

        async function getCurrencyCode (elem){
            let a, b, c, selectedCurrency, iscurrCodeValid        
            a = elem.parentElement
            b = a.getElementsByTagName('div')
            c = b[0].getElementsByTagName('input')

            selectedCurrency = c[0].value   
            console.log(selectedCurrency)  

            iscurrCodeValid = await validateCurrCode(selectedCurrency)

            if (!iscurrCodeValid) {
                c[0].value  = ''
                //alert('Enter a valid currency')
            } else { 
                    selectedCurrency = selectedCurrency.match(/\[(.*)\]/)
                    c[0].value  = ''
                    return selectedCurrency[1]
            }

            
        
            async function validateCurrCode(currencyCode){
                let currencies = await getAllCurrencies()
                for (let i=0;i<currencies.length; i++){
                    if (currencyCode === `[${currencies[i][0]}] ${currencies[i][1]}`) return true
                }

                return false

            }
        }

    })
    
}

showCurrency()

/****************************************************************************
 ***************************** Show to show Warnings ************************
 ****************************************************************************/
function showWarning(message){
    const warningDiv = document.querySelector('#warning-div')
    function closeWarning(elem){
        elem.addEventListener('click', function(){
            warningDiv.style.display = 'none'
        })
    }
    const closeButton = warningDiv.getElementsByTagName('button')

    closeWarning(closeButton[0])
    showElem = warningDiv.getElementsByTagName('p')
    showElem[0].textContent = message
    warningDiv.style.display = 'block'

}
