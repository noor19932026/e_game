"""Build authentic pre-expansion fixtures, with the original stock and session keys."""
from collections import Counter
from copy import deepcopy

GOODS = {
    'supermarket': ['milk','bread','egg','water','carrot','cheese','apple','orange'],
    'fruit': ['apple','orange','banana','pear','strawberry','grapes'],
    'fashion': [f'{color}-{kind}' for color in ['red','blue','green'] for kind in ['shirt','hat','shoes']],
}
MENUS = {
    'supermarket': [[('milk',1),('bread',1),('egg',1)],[('water',1),('apple',2)],[('bread',1),('carrot',1),('cheese',1)],[('milk',2),('egg',2)],[('orange',2),('cheese',1)],[('water',2),('bread',1),('apple',1)]],
    'fruit': [[('apple',3)],[('banana',3)],[('orange',1),('pear',1),('strawberry',1)],[('orange',3)],[('apple',2),('grapes',1)],[('strawberry',3)]],
    'fashion': [[('red-shirt',1),('red-hat',1),('red-shoes',1)],[('blue-shirt',1),('blue-shoes',1)],[('green-shirt',1),('green-hat',1),('green-shoes',1)],[('red-shirt',1),('blue-hat',1),('blue-shoes',1)],[('green-shirt',1),('blue-shoes',1)],[('red-hat',1),('green-hat',1)]],
}


def legacy_save(snapshot, version):
    state = deepcopy(snapshot)
    state['version'] = version
    if version >= 6:
        for shop, session in state['stores']['sessions'].items():
            stock = Counter({item:1 for item in GOODS[shop]})
            for i in range(3):
                if not session['served'][i]:
                    for item, count in MENUS[shop][((session['round']-1)*3+i)%6]:
                        stock[item] += count
            stock.subtract(session['tray'])
            assert all(n >= 0 for n in stock.values())
            session['shelf'] = list(stock.elements())
            session.pop('contentFrom', None)
    if version >= 7:
        state['kitchen'].pop('contentFrom', None)
        state['room']['sessions'] = {key:state['room']['sessions'][key] for key in ['welcome','school','evening']}
    if version == 8:
        for field in ['delivery','fishing','care','farm']: state[field].pop('contentFrom', None)
        state['care'].pop('memories',None)
        state['farm']['produce'] = {key:state['farm']['produce'][key] for key in ['carrot','tomato','sunflower']}
        state['adventure']['sessions'] = dict(list(state['adventure']['sessions'].items())[:6])
    if version < 8:
        for field in ['delivery','fishing','care','farm','adventure']: state.pop(field, None)
    if version < 7:
        for field in ['kitchen','room']: state.pop(field, None)
    return state


def assert_preserved(old, new, path=''):
    if isinstance(old, dict):
        for key, value in old.items():
            assert key in new, path+key
            assert_preserved(value, new[key], path+key+'.')
    else:
        assert old == new, (path, old, new)
