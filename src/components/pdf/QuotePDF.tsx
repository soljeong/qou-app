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

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'NotoSansKR',
        fontSize: 9,
        lineHeight: 1.4,
    },
    // Top Right Quote No
    quoteNo: {
        position: 'absolute',
        top: 40,
        right: 40,
        fontSize: 9,
        fontWeight: 'bold',
    },
    titleContainer: {
        marginTop: 10,
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        letterSpacing: 20,
    },
    infoContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#000',
        height: 120,
        marginBottom: 20,
    },
    recipientBox: {
        width: '45%',
        padding: 10,
        borderRightWidth: 1,
        borderRightStyle: 'solid',
        borderRightColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    recipientName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    supplierBox: {
        flex: 1,
        flexDirection: 'row',
    },
    supplierLabel: {
        width: 30,
        backgroundColor: '#f9f9f9',
        borderRightWidth: 1,
        borderRightStyle: 'solid',
        borderRightColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    supplierInfo: {
        flex: 1,
    },
    supplierRow: {
        flexDirection: 'row',
        height: '20%',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#000',
        alignItems: 'center',
        paddingLeft: 8,
    },
    supplierLabelText: {
        width: 60,
        fontWeight: 'bold',
        fontSize: 8.5,
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderTopWidth: 1,
        borderTopStyle: 'solid',
        borderTopColor: '#000',
        borderLeftWidth: 1,
        borderLeftStyle: 'solid',
        borderLeftColor: '#000',
        height: 25,
        alignItems: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderLeftWidth: 1,
        borderLeftStyle: 'solid',
        borderLeftColor: '#000',
        minHeight: 30,
    },
    tableCell: {
        borderRightWidth: 1,
        borderRightStyle: 'solid',
        borderRightColor: '#000',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#000',
        padding: 4,
        justifyContent: 'center',
    },
    footerContainer: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    totalsTable: {
        width: '40%',
        borderTopWidth: 1,
        borderTopStyle: 'solid',
        borderTopColor: '#000',
        borderLeftWidth: 1,
        borderLeftStyle: 'solid',
        borderLeftColor: '#000',
    },
    totalsRow: {
        flexDirection: 'row',
        height: 20,
        alignItems: 'center',
    },
    totalsLabel: {
        width: '50%',
        backgroundColor: '#f9f9f9',
        borderRightWidth: 1,
        borderRightStyle: 'solid',
        borderRightColor: '#000',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#000',
        padding: 3,
        fontWeight: 'bold',
        fontSize: 8.5,
    },
    totalsValue: {
        width: '50%',
        borderRightWidth: 1,
        borderRightStyle: 'solid',
        borderRightColor: '#000',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#000',
        padding: 3,
        textAlign: 'right',
        fontSize: 8.5,
    },
});

import { calculateItemSpans } from '@/lib/quote-utils';

export const QuotePDF = ({ quote }: { quote: Quote & { items: QuoteItem[], recipientContact?: string | null } }) => {
    const itemSpans = calculateItemSpans(quote.items);
    const totalAmount = quote.items.reduce((sum, item) => sum + (item.qty * (item.unitPrice || 0)), 0);
    const discount = (quote as any).discount || 0;
    const supplyPrice = totalAmount - discount;
    const vat = Math.floor(supplyPrice * 0.1);
    const total = supplyPrice + vat;

    return (
        <Document title={`견적서_${quote.recipientName}`}>
            <Page size="A4" style={styles.page}>
                <Text style={styles.quoteNo}>NO. {quote.quoteNo}</Text>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>견 적 서</Text>
                </View>

                {/* Recipient & Supplier Info */}
                <View style={styles.infoContainer}>
                    <View style={styles.recipientBox}>
                        <Text style={styles.recipientName}>{quote.recipientName}</Text>
                        <Text style={{ fontSize: 11, marginBottom: 4 }}>
                            {quote.recipientContact ? `${quote.recipientContact} 귀하` : '귀하'}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#333' }}>
                            {`${new Date(quote.date).getFullYear()}. ${new Date(quote.date).getMonth() + 1}. ${new Date(quote.date).getDate()}.`}
                        </Text>
                        <Text style={{ fontSize: 10, marginTop: 4 }}>아래와 같이 견적합니다.</Text>
                    </View>

                    <View style={styles.supplierBox}>
                        <View style={styles.supplierLabel}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>공</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', marginTop: 4 }}>급</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', marginTop: 4 }}>자</Text>
                        </View>
                        <View style={styles.supplierInfo}>
                            <View style={styles.supplierRow}>
                                <Text style={styles.supplierLabelText}>등록번호</Text>
                                <Text style={{ fontSize: 11, fontWeight: 'bold' }}>137-81-30557</Text>
                            </View>
                            <View style={styles.supplierRow}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.supplierLabelText}>상 호</Text>
                                    <Text style={{ fontSize: 9 }}>은성 일렉콤</Text>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 1, borderLeftStyle: 'solid', borderLeftColor: '#000', height: '100%', paddingLeft: 8 }}>
                                    <Text style={{ width: 40, fontSize: 8.5, fontWeight: 'bold' }}>대표자</Text>
                                    <Text style={{ fontSize: 9 }}>임인걸</Text>
                                </View>
                            </View>
                            <View style={styles.supplierRow}>
                                <Text style={styles.supplierLabelText}>사업장주소</Text>
                                <Text style={{ fontSize: 8.5 }}>인천광역시 서구 원창로 61-11</Text>
                            </View>
                            <View style={styles.supplierRow}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.supplierLabelText}>업 태</Text>
                                    <Text style={{ fontSize: 9 }}>제조</Text>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 1, borderLeftStyle: 'solid', borderLeftColor: '#000', height: '100%', paddingLeft: 8 }}>
                                    <Text style={{ width: 40, fontSize: 8.5, fontWeight: 'bold' }}>종 목</Text>
                                    <Text style={{ fontSize: 9 }}>전자부품</Text>
                                </View>
                            </View>
                            <View style={[styles.supplierRow, { borderBottomWidth: 0 }]}>
                                <Text style={styles.supplierLabelText}>연 락 처</Text>
                                <Text style={{ fontSize: 9 }}>Tel. 032-582-8715</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <View style={[styles.tableCell, { width: '25%' }]}><Text style={{ textAlign: 'center', fontWeight: 'bold' }}>품 명</Text></View>
                        <View style={[styles.tableCell, { width: '20%' }]}><Text style={{ textAlign: 'center', fontWeight: 'bold' }}>규 격</Text></View>
                        <View style={[styles.tableCell, { width: '10%' }]}><Text style={{ textAlign: 'center', fontWeight: 'bold' }}>수량</Text></View>
                        <View style={[styles.tableCell, { width: '15%' }]}><Text style={{ textAlign: 'center', fontWeight: 'bold' }}>단가(원)</Text></View>
                        <View style={[styles.tableCell, { width: '15%' }]}><Text style={{ textAlign: 'center', fontWeight: 'bold' }}>금액(원)</Text></View>
                        <View style={[styles.tableCell, { width: '15%' }]}><Text style={{ textAlign: 'center', fontWeight: 'bold' }}>비 고</Text></View>
                    </View>

                    {quote.items.map((item, index) => {
                        const spanInfo = itemSpans[index];
                        const amount = item.qty * (item.unitPrice || 0);
                        const isLastItem = index === quote.items.length - 1;

                        return (
                            <View key={item.id} style={styles.tableRow}>
                                <View style={[
                                    styles.tableCell,
                                    {
                                        width: '25%',
                                        borderBottomWidth: (!isLastItem && !spanInfo.isLastInSpan) ? 0 : 1
                                    }
                                ]}>
                                    {spanInfo.isFirst ? <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.name}</Text> : null}
                                </View>
                                <View style={[styles.tableCell, { width: '20%' }]}>
                                    <Text style={{ textAlign: 'center' }}>{item.process}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '10%' }]}>
                                    <Text style={{ textAlign: 'center' }}>{item.qty}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '15%' }]}>
                                    <Text style={{ textAlign: 'right' }}>{item.unitPrice ? item.unitPrice.toLocaleString() : '0'}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '15%' }]}>
                                    <Text style={{ textAlign: 'right', fontWeight: 'bold' }}>{amount.toLocaleString()}</Text>
                                </View>
                                <View style={[styles.tableCell, { width: '15%' }]}>
                                    <Text style={{ fontSize: 7, textAlign: 'center' }}>{item.note || ''}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Totals Summary */}
                <View style={styles.footerContainer}>
                    <View style={styles.totalsTable}>
                        {discount > 0 && (
                            <>
                                <View style={styles.totalsRow}>
                                    <Text style={styles.totalsLabel}>소      계(원)</Text>
                                    <Text style={styles.totalsValue}>{totalAmount.toLocaleString()}</Text>
                                </View>
                                <View style={styles.totalsRow}>
                                    <Text style={[styles.totalsLabel, { color: 'red' }]}>할      인(원)</Text>
                                    <Text style={[styles.totalsValue, { color: 'red' }]}>-{discount.toLocaleString()}</Text>
                                </View>
                            </>
                        )}
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>공급가액(원)</Text>
                            <Text style={styles.totalsValue}>{supplyPrice.toLocaleString()}</Text>
                        </View>
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>부 가 세(원)</Text>
                            <Text style={styles.totalsValue}>{vat.toLocaleString()}</Text>
                        </View>
                        <View style={styles.totalsRow}>
                            <Text style={[styles.totalsLabel, { fontSize: 10 }]}>합  계(원)</Text>
                            <Text style={[styles.totalsValue, { fontSize: 10, fontWeight: 'bold' }]}>{total.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Notes */}
                <View style={{ marginTop: 40 }}>
                    <Text style={{ fontSize: 9, marginBottom: 4 }}>* 메탈마스크 개당 110,000원 입니다.</Text>
                    <Text style={{ fontSize: 9, marginBottom: 4 }}>* 메탈마스크 프레임은 대여 기준입니다.</Text>
                    <Text style={{ fontSize: 9 }}>* 추후 메탈마스크 폐기시에 프레임은 반납요청드립니다.</Text>
                </View>
            </Page>
        </Document>
    );
};
