/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Quote, QuoteItem } from '@prisma/client';

// Register Korean Font
Font.register({
    family: 'NotoSansKR',
    fonts: [
        { src: '/fonts/NotoSansKR-Regular.otf', fontWeight: 400 },
        { src: '/fonts/NotoSansKR-Bold.otf', fontWeight: 700 }, // Bold
    ],
});

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 30, // 14mm is approx 40pt, but 30 is good margin
        fontFamily: 'NotoSansKR',
        fontSize: 10,
        lineHeight: 1.4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 5,
        flexGrow: 1,
    }, // Quote No at top right
    quoteNo: {
        fontSize: 10,
        position: 'absolute',
        right: 0,
        top: 0
    },
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#000',
        height: 120, // Fixed height for alignment
    },
    infoLeft: {
        width: '50%',
        padding: 10,
        borderRightWidth: 1,
        borderRightColor: '#000',
        flexDirection: 'column',
        justifyContent: 'space-around',
    },
    infoRight: {
        width: '50%',
        padding: 5,
        // Add internal table for supplier info?
    },
    supplierRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc', // Lighter internal lines? Or black? Spec says table form
        alignItems: 'center',
        height: 20,
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableCol: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    // Row merging styles
    hiddenCell: {
        color: 'transparent',
        borderTopWidth: 0, // Make it look merged
    }
});

interface QuotePDFProps {
    quote: Quote & { items: QuoteItem[] };
}

// Helper to pre-process items for row spanning
const processItems = (items: QuoteItem[]) => {
    const spans = new Array(items.length).fill(1).map(() => ({ rowSpan: 1, isFirst: true }));

    // This is for visual merging. 
    // In react-pdf, we can't easily do 'rowspan' like HTML table.
    // We have to simulate it by not drawing the bottom border for the first N-1 rows,
    // and not drawing the content for the subsequent rows.
    // Actually, 'borderTop' of the NEXT row should be removed, or borderBottom of CURRENT.

    // Let's analyze names
    for (let i = 0; i < items.length; i++) {
        if (i > 0 && items[i].name === items[i - 1].name) {
            spans[i].isFirst = false;
            spans[i].rowSpan = 0; // Means hidden

            // Increment span of the first one
            let ptr = i - 1;
            while (ptr >= 0 && !spans[ptr].isFirst) ptr--;
            spans[ptr].rowSpan++;
        }
    }
    return spans;
};

export const QuotePDF = ({ quote }: QuotePDFProps) => {
    const itemSpans = processItems(quote.items);
    const totalAmount = quote.items.reduce((sum, item) => sum + (item.qty * (item.unitPrice || 0)), 0);
    const vat = Math.floor(totalAmount * 0.1);
    const total = totalAmount + vat;

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.quoteNo}>NO. {quote.quoteNo}</Text>
                    <View style={{ width: '100%', alignItems: 'center', marginTop: 10 }}>
                        <Text style={styles.title}>견  적  서</Text>
                    </View>
                </View>

                {/* Info Section - Left: Recipient, Right: Supplier */}
                <View style={styles.infoSection}>
                    <View style={styles.infoLeft}>
                        <Text style={{ fontSize: 16 }}>{quote.recipientName} 귀하</Text>
                        <Text>견적일: {new Date(quote.date).toLocaleDateString()}</Text>
                        <Text>아래와 같이 견적합니다.</Text>
                    </View>
                    <View style={styles.infoRight}>
                        {/* Supplier Table Simulation */}
                        <View style={{ flexDirection: 'row', height: '100%' }}>
                            <View style={{ width: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', borderRightWidth: 1 }}>
                                <Text style={{ width: 10 }}>공급자</Text>
                            </View>
                            <View style={{ flex: 1, flexDirection: 'column' }}>
                                <View style={{ flexDirection: 'row', height: '25%', borderBottomWidth: 1, alignItems: 'center', paddingLeft: 5 }}>
                                    <Text style={{ width: 60 }}>등록번호</Text>
                                    <Text>123-45-67890 (임시)</Text>
                                </View>
                                <View style={{ flexDirection: 'row', height: '25%', borderBottomWidth: 1, alignItems: 'center', paddingLeft: 5 }}>
                                    <Text style={{ width: 60 }}>상호</Text>
                                    <Text style={{ flex: 1 }}>QOU Systems</Text>
                                    <Text style={{ width: 40 }}>성명</Text>
                                    <Text style={{ flex: 1 }}>홍길동  (인)</Text>
                                </View>
                                <View style={{ flexDirection: 'row', height: '25%', borderBottomWidth: 1, alignItems: 'center', paddingLeft: 5 }}>
                                    <Text style={{ width: 60 }}>주소</Text>
                                    <Text>서울시 강남구 테헤란로 123</Text>
                                </View>
                                <View style={{ flexDirection: 'row', height: '25%', alignItems: 'center', paddingLeft: 5 }}>
                                    <Text style={{ width: 60 }}>업태</Text>
                                    <Text style={{ flex: 1 }}>서비스</Text>
                                    <Text style={{ width: 40 }}>종목</Text>
                                    <Text style={{ flex: 1 }}>SW개발</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Total Summary Bar */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 2, borderColor: 'black', marginBottom: 10, paddingBottom: 5, justifyContent: 'space-between' }}>
                    <Text>합계금액 : 일금 {new Intl.NumberFormat('ko-KR').format(total)}원정 (Please check implementation of hangul numbers if needed)</Text>
                    <Text>(\ {new Intl.NumberFormat('ko-KR').format(total)})</Text>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCol, { width: '25%' }]}>
                            <Text>품명</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '25%' }]}>
                            <Text>공정</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '10%' }]}>
                            <Text>수량</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '15%' }]}>
                            <Text>단가</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '15%' }]}>
                            <Text>금액</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '10%' }]}>
                            <Text>비고</Text>
                        </View>
                    </View>

                    {/* Rows */}
                    {quote.items.map((item, index) => {
                        const spanInfo = itemSpans[index];
                        const amount = item.qty * (item.unitPrice || 0);

                        return (
                            <View key={item.id} style={styles.tableRow}>
                                {/* Name Column - Handle Merging */}
                                <View style={[styles.tableCol, { width: '25%', borderBottomWidth: spanInfo.isFirst && spanInfo.rowSpan > 1 ? 0 : 1 }]}>
                                    {spanInfo.isFirst ? <Text>{item.name}</Text> : null}
                                    {/* If not first, we render nothing (empty), but the cell border handling is tricky.
                                Use a white box overlay? Or just logic.
                                If it's part of a span but not first, the top border should be 0.
                                Actually borderTopWidth: 0 on all cells is default, they use borderBottom.
                                So if we want to merge vertically:
                                Row 1: Draw text. borderBottom = 0 if span > 1.
                                Row 2: Draw empty. borderBottom = 0 if it's not the last one.
                                Let's simplify.
                            */}
                                </View>

                                {/* Process */}
                                <View style={[styles.tableCol, { width: '25%' }]}>
                                    <Text>{item.process}</Text>
                                </View>
                                {/* Qty */}
                                <View style={[styles.tableCol, { width: '10%', textAlign: 'center' }]}>
                                    <Text>{item.qty}</Text>
                                </View>
                                {/* Unit Price */}
                                <View style={[styles.tableCol, { width: '15%', textAlign: 'right' }]}>
                                    <Text>{item.unitPrice ? item.unitPrice.toLocaleString() : ''}</Text>
                                </View>
                                {/* Amount */}
                                <View style={[styles.tableCol, { width: '15%', textAlign: 'right' }]}>
                                    <Text>{amount.toLocaleString()}</Text>
                                </View>
                                {/* Note */}
                                <View style={[styles.tableCol, { width: '10%' }]}>
                                    <Text>{item.note}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Footer Totals */}
                <View style={{ marginTop: 20, alignSelf: 'flex-end', width: '40%' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text>소계</Text>
                        <Text>{totalAmount.toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text>부가세</Text>
                        <Text>{vat.toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 5, fontWeight: 'bold' }}>
                        <Text>합계</Text>
                        <Text>{total.toLocaleString()}</Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
};
