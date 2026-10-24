let data= await fetch('/api/itemsData');
let response  = await data.json();

//console.log(response)

const productsData = response;

export default productsData;