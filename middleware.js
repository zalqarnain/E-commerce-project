module.exports.format = (obj)=> {
    obj.price = parseInt(obj.price)
    obj.quantity = parseInt(obj.quantity)
    if (obj.cat_id == 'him') {
        obj.cat_id = 2;
    } else if (obj.cat_id == 'her') {
        obj.cat_id = 1;
    } else {
        obj.cat_id = 3;
    }
    return obj;
};