from os import listdir
from os.path import isfile, join

# Dependency variable
sender = input('Address of sender: ')
receiver = input('Address of receiver: ')
eth = input('Number of ether: ')
token = input('Number of token: ')


# Use function to ch
sendeth_bal = 100
reieth_bal = 100
sendtok_bal = 100
reitok_bal = 100

# 2 init state - 2 senteth state - 2 senttoken state
state = {'1': ['0xAAAA', 100, 100], '2': ['0xBBBB', 100, 100], '3': ['0xAAAA', 70, 100], '4': ['0xBBBB', 100, 90],
         '5': ['0xAAAA', 70, 110], '6': ['0xBBBB', 130, 90]}

cfgstate = dict()

sendeth = 'sendeth(address,address,uint256)'
sendtoken = 'sendtoken(address,address,address,uint256)'

cfg_source = '/Users/mac/Desktop/demoExpress/smart contract/solidity/escrow'

onlyfiles = [f for f in listdir(cfg_source) if isfile(join(cfg_source, f))]


def find_func(funclist):
    list_func = []
    for f in funclist:
        if sendeth in f or sendtoken in f:
            list_func.append(f)

    #     f = f.replace('.dot', '')
    #     temp = f.split('-')
    #     if len(temp) > 1:
    #         list_func.append(temp[2])
    return list_func


def handle_cfg(func_call):

    #sendeth
    with open(cfg_source + '/' + func_call[1]) as FileObj:
        for lines in FileObj:
            {}
    cfgstate['3'] = [sender, "100-ether_amount", 100]

    # sendtoken
    with open(cfg_source + '/' + func_call[0]) as FileObj:
        for lines in FileObj:
            {}
    cfgstate['4'] = [receiver, 100, "100-token_amount"]

    # # withdrawtoken
    # with open(cfg_source + '/' + func_call[0]) as FileObj:
    #     for lines in FileObj:
    #         {}
    cfgstate['5'] = [sender, "100-ether_amount", "100+token_amount" ]

    # # withdraweth
    # with open(cfg_source + '/' + func_call[1]) as FileObj:
    #     for lines in FileObj:
    #         {}
    cfgstate['6'] = [receiver, "100+ether_amount", "100-token_amount"]


def compare_state(state, cfgstate):
    temp = True
    for x in range(3):
        if state[x] != cfgstate[x]:
            temp = False
    return temp


def complete_cfgstate(cfgstate, eth , token):
    cfgstate.get('3')[1] = sendeth_bal - int(eth)
    cfgstate.get('4')[2] = reitok_bal - int(token)
    cfgstate.get('5')[1] = cfgstate.get('3')[1]
    cfgstate.get('5')[2] = sendtok_bal + int(token)
    cfgstate.get('6')[1] = reieth_bal + int(eth)
    cfgstate.get('6')[2] = cfgstate.get('4')[2]


def init_state(sender, receiver ):
    cfgstate['1'] = [sender, sendeth_bal, sendtok_bal]
    cfgstate['2'] = [receiver, reieth_bal, reitok_bal]


print("-------------------------------------------")
print("Function deployed as follow: ")
print(sendeth + " <-> " + sendtoken)

print("-------------------------------------------")
init_state(sender, receiver)
func_call = find_func(onlyfiles)
handle_cfg(func_call)
for x in cfgstate:
    print(cfgstate[x])

print("-------------------------------------------")
complete_cfgstate(cfgstate, eth, token)
for x in cfgstate:
    print(cfgstate[x])

print("-------------------------------------------")
temp_check = True
for key in cfgstate.keys():
    temp_check = compare_state(state.get(key),cfgstate.get(key))
    if temp_check == False:
        print(state.get(key), cfgstate.get(key))
        print("2 states are not match")
        break
if temp_check == True:
    print("Does not found any issues")
