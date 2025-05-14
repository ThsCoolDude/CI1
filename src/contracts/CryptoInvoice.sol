// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CryptoInvoice {
    address public owner;
    address public feeWallet;

    event InvoicePaid(address indexed recipient, uint256 amount, uint256 fee);

    constructor(address _feeWallet) {
        owner = msg.sender;
        feeWallet = _feeWallet;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function payInvoice(address recipient, uint256 fee) external payable {
        require(msg.value > fee, "Amount must be greater than fee");
        require(recipient != address(0), "Invalid recipient address");
        require(fee > 0, "Fee must be greater than zero");

        // Calculate amount after fee
        uint256 amountAfterFee = msg.value - fee;

        // Send fee to fee wallet
        (bool feeSuccess, ) = feeWallet.call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        // Send remaining amount to recipient
        (bool recipientSuccess, ) = recipient.call{value: amountAfterFee}("");
        require(recipientSuccess, "Recipient transfer failed");

        emit InvoicePaid(recipient, amountAfterFee, fee);
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