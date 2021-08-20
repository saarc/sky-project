package main

// 외부모듈 추가
import (
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

// SmartContract 클래스 구조체 정의
type SimpleAsset struct {
}

// (TO DO) ASSET 구조체정의 -> JSON

// Init 함수정의
func (t *SimpleAsset) Init(stub shim.ChaincodeStubInterface) peer.Response {

	return shim.Success(nil)
}

// Invoke 함수 정의 //
func (t *SimpleAsset) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	fn, args := stub.GetFunctionAndParameters()

	var result string
	var err error

	if fn == "set" {
		result, err = t.Set(stub, args)
	} else if fn == "get" {
		result, err = t.Get(stub, args)
	} else if fn == "transfer" {
		result, err = t.Transfer(stub, args)
	} else {
		return shim.Error("Not supported function name")
	}
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(result))
}

// set 함수 정의
func (t *SimpleAsset) Set(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 2 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
	}

	err := stub.PutState(args[0], []byte(args[1]))
	if err != nil {
		return "", fmt.Errorf("Failed to create asset: %s", args[0])
	}

	return args[1], nil
}

// get 함수 정의
func (t *SimpleAsset) Get(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}
	value, err := stub.GetState(args[0])
	if err != nil {
		return "", fmt.Errorf("Failed to get asset: %s with error: %s", args[0], err)
	}
	if value == nil {
		return "", fmt.Errorf("Asset not found: %s", args[0])
	}

	return string(value), nil
}

// transfer 함수 추가 정의
func (t *SimpleAsset) Transfer(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 3 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a source, destination and amount")
	}
	// 계좌확인
	var from, to []byte
	var err error

	from, err = stub.GetState(args[0])
	if err != nil {
		return "", fmt.Errorf("Failed to get asset: %s with error: %s", args[0], err)
	}
	if from == nil {
		return "", fmt.Errorf("Asset not found: %s", args[0])
	}
	// 계좌확인
	to, err = stub.GetState(args[1])
	if err != nil {
		return "", fmt.Errorf("Failed to get asset: %s with error: %s", args[1], err)
	}
	if to == nil {
		return "", fmt.Errorf("Asset not found: %s", args[1])
	}
	//잔액확인
	from_bal, _ := strconv.Atoi(string(from))
	amount, _ := strconv.Atoi(args[2])
	to_bal, _ := strconv.Atoi(string(to))

	if from_bal < amount {
		return "", fmt.Errorf("Not enough balance: %s", args[0])
	}

	newbal_from := from_bal - amount
	newbal_to := to_bal + amount

	err = stub.PutState(args[0], []byte(strconv.Itoa(newbal_from)))
	if err != nil {
		return "", fmt.Errorf("Failed to update asset: %s", args[0])
	}

	err = stub.PutState(args[1], []byte(strconv.Itoa(newbal_to)))
	if err != nil {
		return "", fmt.Errorf("Failed to update asset: %s", args[1])
	}

	return strconv.Itoa(newbal_to), nil
}

// main 함수 정의
func main() {
	if err := shim.Start(new(SimpleAsset)); err != nil {
		fmt.Printf("Error starting SimpleAsset chaincode: %s", err)
	}
}
