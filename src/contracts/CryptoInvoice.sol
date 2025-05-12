// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CryptoInvoice {
    address public owner;
    address public feeWallet;
    uint256 public constant FEE_AMOUNT = 1 ether; // $1 fee in wei

    event InvoicePaid(address indexed recipient, uint256 amount, uint256 fee);

    constructor(address _feeWallet) {
        owner = msg.sender;
        feeWallet = _feeWallet;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function payInvoice(address recipient) external payable {
        require(msg.value > FEE_AMOUNT, "Amount must be greater than fee");
        require(recipient != address(0), "Invalid recipient address");

        // Calculate amount after fee
        uint256 amountAfterFee = msg.value - FEE_AMOUNT;

        // Send fee to fee wallet
        (bool feeSuccess, ) = feeWallet.call{value: FEE_AMOUNT}("");
        require(feeSuccess, "Fee transfer failed");

        // Send remaining amount to recipient
        (bool recipientSuccess, ) = recipient.call{value: amountAfterFee}("");
        require(recipientSuccess, "Recipient transfer failed");

        emit InvoicePaid(recipient, amountAfterFee, FEE_AMOUNT);
    }

    function updateFeeWallet(address newFeeWallet) external onlyOwner {
        require(newFeeWallet != address(0), "Invalid fee wallet address");
        feeWallet = newFeeWallet;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    receive() external payable {}
} 