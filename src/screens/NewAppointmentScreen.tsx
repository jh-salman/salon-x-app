import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G } from 'react-native-svg';
import { useEvents } from '../context/EventsContext';
import { useServices } from '../context/ServicesContext';
import { useClients } from '../context/ClientsContext';
import { CustomerDropdown, type CustomerOption } from '../components/CustomerDropdown';
import { ServiceDropdown } from '../components/ServiceDropdown';
import type { ServiceOption } from '../data/services';
import { wp, hp, ms, vs } from '../utils/responsive';

export function NewAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; hour?: string }>();
  const { addEvent } = useEvents();
  const { services, lastAddedService, clearLastAddedService } = useServices();
  const { clients, lastAddedClient, clearLastAddedClient } = useClients();

  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<{ x: number; y: number; width: number; height: number } | undefined>();
  const [serviceTriggerLayout, setServiceTriggerLayout] = useState<{ x: number; y: number; width: number; height: number } | undefined>();
  const customerFieldRef = useRef<View>(null);
  const serviceFieldRef = useRef<View>(null);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('60');
  const [appointmentType, setAppointmentType] = useState('');
  const [depositDue, setDepositDue] = useState('50%');
  const [notes, setNotes] = useState('');

  const [startDate, setStartDate] = useState<Date>(() => new Date());
  const appliedFromContextRef = useRef(false);
  const lastAddedClientRef = useRef(lastAddedClient);
  const lastAddedServiceRef = useRef(lastAddedService);
  lastAddedClientRef.current = lastAddedClient;
  lastAddedServiceRef.current = lastAddedService;

  useFocusEffect(
    useCallback(() => {
      setCustomerDropdownOpen(false);
      setServiceDropdownOpen(false);
      if (params?.date && params?.hour) {
        const d = new Date(params.date);
        const hour = parseInt(String(params.hour), 10) || 9;
        d.setHours(hour, 0, 0, 0);
        setStartDate(d);
      }
      const timer = setTimeout(() => {
        const pendingClient = lastAddedClientRef.current;
        const pendingService = lastAddedServiceRef.current;
        if (pendingClient) {
          setCustomer(pendingClient);
          clearLastAddedClient();
          appliedFromContextRef.current = true;
        }
        if (pendingService) {
          setSelectedService(pendingService);
          clearLastAddedService();
          appliedFromContextRef.current = true;
        }
        if (!pendingClient && !pendingService) {
          if (appliedFromContextRef.current) {
            appliedFromContextRef.current = false;
          } else {
            setCustomer(null);
            setSelectedService(null);
            setPrice('');
            setDuration('60');
            setAppointmentType('');
            setDepositDue('50%');
            setNotes('');
            setRepeatEnabled(false);
            if (!params?.date || !params?.hour) {
              setStartDate(new Date());
            }
          }
        }
      }, 80);
      return () => clearTimeout(timer);
    }, [params?.date, params?.hour, clearLastAddedClient, clearLastAddedService])
  );

  useEffect(() => {
    if (selectedService) {
      if (selectedService.price != null) setPrice(String(selectedService.price));
      const clientDur = selectedService.duration ?? 60;
      const block = selectedService.blockTimeAfter ?? 0;
      setDuration(String(clientDur + block));
    }
  }, [selectedService]);

  const dateStr = format(startDate, 'EEE, MMM d, yyyy');
  const timeStr = format(startDate, 'h:mm a');
  const totalMinutes = parseInt(duration, 10) || 60;
  const endDate = dayjs(startDate).add(totalMinutes, 'minute').toDate();

  const handleAddNewCustomer = () => {
    setCustomerDropdownOpen(false);
    router.push('/new-customer');
  };

  const handleAddNewService = () => {
    setServiceDropdownOpen(false);
    router.push('/new-service');
  };

  const handleBook = () => {
    const clientName = customer?.name || 'New Customer';
    const serviceName = selectedService?.name || 'Service';
    addEvent({
      title: clientName,
      clientName: serviceName,
      service: serviceName,
      start: startDate,
      end: endDate,
      color: selectedService?.calendarColor ?? '#25AFFF',
      allDay: false,
      processingTimeStart: selectedService?.processingTimeStart,
      processingTimeEnd: selectedService?.processingTimeEnd,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#010010', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Svg width={15} height={10} viewBox="0 0 15.6059 10.1073">
              <G>
                <Path
                  d="M4.74241 4.97939L8.48012 0.307264L4.11946 0.307263L0.381754 4.97939L4.11946 9.80726L8.48011 9.80726L4.74241 4.97939Z"
                  stroke="#25AFFF"
                  strokeWidth="0.6"
                  fill="none"
                />
                <Path
                  d="M14.8228 0.299999L12.0195 0.299999L8.12607 4.97213L12.0195 9.8L14.9785 9.8L11.0851 4.97213L14.8228 0.299999Z"
                  stroke="#25AFFF"
                  strokeWidth="0.6"
                  fill="none"
                />
              </G>
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Appointment</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Form Fields - all same width and gap */}
        <View style={styles.formContainer}>
          {/* Select Customer - same as other inputs */}
          <View ref={customerFieldRef} style={styles.customerFieldWrapper} collapsable={false}>
            <TouchableOpacity
              style={styles.inputField}
              activeOpacity={0.8}
              onPress={() => {
                customerFieldRef.current?.measureInWindow((x, y, width, height) => {
                  setTriggerLayout({ x, y, width, height });
                  setCustomerDropdownOpen((v) => !v);
                });
              }}
            >
              <Svg width={16} height={16} viewBox="0 0 16.6234 16.6234" style={styles.inputIcon}>
                <Path
                  d="M8.31169 8.31169C10.6078 8.31169 12.4675 6.45195 12.4675 4.15584C12.4675 1.85974 10.6078 0 8.31169 0C6.01558 0 4.15584 1.85974 4.15584 4.15584C4.15584 6.45195 6.01558 8.31169 8.31169 8.31169ZM8.31169 10.3896C5.53766 10.3896 0 11.7818 0 14.5455V15.5844C0 16.1558 0.467532 16.6234 1.03896 16.6234H15.5844C16.1558 16.6234 16.6234 16.1558 16.6234 15.5844V14.5455C16.6234 11.7818 11.0857 10.3896 8.31169 10.3896Z"
                  fill="#A3A3A3"
                />
              </Svg>
              <Text style={[styles.inputText, !customer && styles.customerPlaceholder, customer && styles.inputValue]}>
                {customer?.name || 'Select Customer'}
              </Text>
              <Svg width={10} height={5} viewBox="0 0 10 5">
                <Path
                  d="M1.53244 0.222096L5.00447 3.16819L8.47651 0.222096C8.8255 -0.0740319 9.38926 -0.0740319 9.73826 0.222096C10.0872 0.518223 10.0872 0.996583 9.73826 1.29271L5.63087 4.7779C5.28188 5.07403 4.71812 5.07403 4.36913 4.7779L0.261745 1.29271C-0.0872483 0.996583 -0.0872483 0.518223 0.261745 0.222096C0.610738 -0.0664389 1.18345 -0.0740319 1.53244 0.222096V0.222096Z"
                  fill="#A3A3A3"
                />
              </Svg>
            </TouchableOpacity>
            <CustomerDropdown
              visible={customerDropdownOpen}
              customers={clients}
              selectedCustomer={customer}
              onSelect={setCustomer}
              onAddNew={handleAddNewCustomer}
              onClose={() => setCustomerDropdownOpen(false)}
              triggerLayout={triggerLayout}
            />
          </View>
          {/* Select Service */}
          <View ref={serviceFieldRef} style={styles.customerFieldWrapper} collapsable={false}>
            <TouchableOpacity
              style={styles.inputField}
              activeOpacity={0.8}
              onPress={() => {
                serviceFieldRef.current?.measureInWindow((x, y, width, height) => {
                  setServiceTriggerLayout({ x, y, width, height });
                  setServiceDropdownOpen(true);
                });
              }}
            >
              <Text style={[styles.inputText, !selectedService && styles.customerPlaceholder, selectedService && styles.inputValue]}>
                {selectedService?.name || 'Select service'}
              </Text>
              <Svg width={10} height={5} viewBox="0 0 10 5">
                <Path
                  d="M1.53244 0.222096L5.00447 3.16819L8.47651 0.222096C8.8255 -0.0740319 9.38926 -0.0740319 9.73826 0.222096C10.0872 0.518223 10.0872 0.996583 9.73826 1.29271L5.63087 4.7779C5.28188 5.07403 4.71812 5.07403 4.36913 4.7779L0.261745 1.29271C-0.0872483 0.996583 -0.0872483 0.518223 0.261745 0.222096C0.610738 -0.0664389 1.18345 -0.0740319 1.53244 0.222096V0.222096Z"
                  fill="#A3A3A3"
                />
              </Svg>
            </TouchableOpacity>
            <ServiceDropdown
              visible={serviceDropdownOpen}
              services={services}
              selectedService={selectedService}
              onSelect={setSelectedService}
              onAddNew={handleAddNewService}
              onClose={() => setServiceDropdownOpen(false)}
              triggerLayout={serviceTriggerLayout}
            />
          </View>

          {/* Date */}
          <View style={styles.inputField}>
            <Svg width={16} height={16} viewBox="0 0 13 14.3333" style={styles.inputIcon}>
              <Path
                d="M9.16667 0.5V3.16667M3.83333 0.5V3.16667M0.5 5.83333H12.5M1.83333 1.83333H11.1667C11.903 1.83333 12.5 2.43029 12.5 3.16667V12.5C12.5 13.2364 11.903 13.8333 11.1667 13.8333H1.83333C1.09695 13.8333 0.5 13.2364 0.5 12.5V3.16667C0.5 2.43029 1.09695 1.83333 1.83333 1.83333Z"
                stroke="#A3A3A3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
            <View style={styles.dateTimeContainer}>
              <Text style={[styles.inputText, styles.inputValue]}>{dateStr}</Text>
              <Text style={[styles.inputText, styles.inputValue, styles.timeText]}>{timeStr}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.inputField}>
            <Svg width={16} height={16} viewBox="0 0 6.66667 12" style={styles.inputIcon}>
              <Path
                d="M3.53333 5.26667C2.02 4.87333 1.53333 4.46667 1.53333 3.83333C1.53333 3.10667 2.20667 2.6 3.33333 2.6C4.28 2.6 4.75333 2.96 4.92667 3.53333C5.00667 3.8 5.22667 4 5.50667 4H5.70667C6.14667 4 6.46 3.56667 6.30667 3.15333C6.02667 2.36667 5.37333 1.71333 4.33333 1.46V1C4.33333 0.446667 3.88667 0 3.33333 0C2.78 0 2.33333 0.446667 2.33333 1V1.44C1.04 1.72 0 2.56 0 3.84667C0 5.38667 1.27333 6.15333 3.13333 6.6C4.8 7 5.13333 7.58667 5.13333 8.20667C5.13333 8.66667 4.80667 9.4 3.33333 9.4C2.23333 9.4 1.66667 9.00667 1.44667 8.44667C1.34667 8.18667 1.12 8 0.846667 8H0.66C0.213333 8 -0.1 8.45333 0.0666666 8.86667C0.446667 9.79333 1.33333 10.34 2.33333 10.5533V11C2.33333 11.5533 2.78 12 3.33333 12C3.88667 12 4.33333 11.5533 4.33333 11V10.5667C5.63333 10.32 6.66667 9.56667 6.66667 8.2C6.66667 6.30667 5.04667 5.66 3.53333 5.26667Z"
                fill="#A3A3A3"
              />
            </Svg>
            <TextInput
              style={[styles.inputText, styles.inputValue]}
              placeholder="Price"
              placeholderTextColor="#A3A3A3"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          {/* Duration */}
          <View style={styles.inputField}>
            <Svg width={16} height={16} viewBox="0 0 12.002 14" style={styles.inputIcon}>
              <Path
                d="M7.33535 0H4.66869C4.30202 0 4.00202 0.3 4.00202 0.666667C4.00202 1.03333 4.30202 1.33333 4.66869 1.33333H7.33535C7.70202 1.33333 8.00202 1.03333 8.00202 0.666667C8.00202 0.3 7.70202 0 7.33535 0ZM6.00202 8.66667C6.36869 8.66667 6.66869 8.36667 6.66869 8V5.33333C6.66869 4.96667 6.36869 4.66667 6.00202 4.66667C5.63535 4.66667 5.33535 4.96667 5.33535 5.33333V8C5.33535 8.36667 5.63535 8.66667 6.00202 8.66667ZM10.6887 4.26L11.1887 3.76C11.442 3.50667 11.4487 3.08667 11.1887 2.82667L11.182 2.82C10.922 2.56 10.5087 2.56667 10.2487 2.82L9.74869 3.32C8.71535 2.49333 7.41535 2 6.00202 2C2.80202 2 0.0820199 4.64 0.00201991 7.84C-0.0846468 11.2267 2.62869 14 6.00202 14C9.32202 14 12.002 11.3133 12.002 8C12.002 6.58667 11.5087 5.28667 10.6887 4.26ZM6.00202 12.6667C3.42202 12.6667 1.33535 10.58 1.33535 8C1.33535 5.42 3.42202 3.33333 6.00202 3.33333C8.58202 3.33333 10.6687 5.42 10.6687 8C10.6687 10.58 8.58202 12.6667 6.00202 12.6667Z"
                fill="#A3A3A3"
              />
            </Svg>
            <TextInput
              style={[styles.inputText, styles.inputValue]}
              placeholder="Duration (min)"
              placeholderTextColor="#A3A3A3"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />
          </View>

          {/* Appointment Type */}
          <View style={styles.inputField}>
            <Svg width={16} height={16} viewBox="0 0 13.9236 12.6667" style={styles.inputIcon}>
              <Path
                d="M0.823289 11.2667L1.71662 11.64V5.62L0.0966221 9.52667C-0.176711 10.2067 0.149955 10.9867 0.823289 11.2667V11.2667ZM13.8233 8.8L10.5166 0.82C10.31 0.32 9.82329 0.0133333 9.30996 0C9.13662 0 8.95662 0.0266667 8.78329 0.1L3.86996 2.13333C3.36996 2.34 3.06329 2.82 3.04996 3.33333C3.04329 3.51333 3.07662 3.69333 3.14996 3.86667L6.45662 11.8467C6.66329 12.3533 7.15662 12.66 7.67662 12.6667C7.84996 12.6667 8.02329 12.6333 8.18995 12.5667L13.0966 10.5333C13.7766 10.2533 14.1033 9.47333 13.8233 8.8V8.8ZM4.38996 4C4.02329 4 3.72329 3.7 3.72329 3.33333C3.72329 2.96667 4.02329 2.66667 4.38996 2.66667C4.75662 2.66667 5.05662 2.96667 5.05662 3.33333C5.05662 3.7 4.75662 4 4.38996 4V4ZM3.05662 11.3333C3.05662 12.0667 3.65662 12.6667 4.38996 12.6667H5.35662L3.05662 7.10667V11.3333Z"
                fill="#A3A3A3"
              />
            </Svg>
            <TextInput
              style={[styles.inputText, styles.inputValue]}
              placeholder="Appointment type"
              placeholderTextColor="#A3A3A3"
              value={appointmentType}
              onChangeText={setAppointmentType}
            />
            <Svg width={10} height={5} viewBox="0 0 10 5">
              <Path
                d="M1.53244 0.222096L5.00447 3.16819L8.47651 0.222096C8.8255 -0.0740319 9.38926 -0.0740319 9.73826 0.222096C10.0872 0.518223 10.0872 0.996583 9.73826 1.29271L5.63087 4.7779C5.28188 5.07403 4.71812 5.07403 4.36913 4.7779L0.261745 1.29271C-0.0872483 0.996583 -0.0872483 0.518223 0.261745 0.222096C0.610738 -0.0664389 1.18345 -0.0740319 1.53244 0.222096V0.222096Z"
                fill="#A3A3A3"
              />
            </Svg>
          </View>

          {/* Repeat */}
          <View style={styles.inputField}>
            <Svg width={16} height={16} viewBox="0 0 13.5 16.1667" style={styles.inputIcon}>
              <Path
                d="M10.0833 0.75L12.75 3.41667M12.75 3.41667L10.0833 6.08333M12.75 3.41667H3.41667C2.70942 3.41667 2.03115 3.69762 1.53105 4.19772C1.03095 4.69781 0.75 5.37609 0.75 6.08333V7.41667M3.41667 15.4167L0.75 12.75M0.75 12.75L3.41667 10.0833M0.75 12.75H10.0833C10.7906 12.75 11.4689 12.469 11.969 11.969C12.469 11.4689 12.75 10.7906 12.75 10.0833V8.75"
                stroke="#A3A3A3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                fill="none"
              />
            </Svg>
            <Text style={styles.inputText}>Repeat</Text>
            <Switch
              value={repeatEnabled}
              onValueChange={setRepeatEnabled}
              trackColor={{ false: '#A3A3A3', true: '#A3A3A3' }}
              thumbColor="#FCFCFC"
              ios_backgroundColor="#A3A3A3"
              style={styles.switch}
            />
          </View>

          {/* Deposit Due */}
          <View style={styles.inputField}>
            <Svg width={16} height={16} viewBox="0 0 6.66667 12" style={styles.inputIcon}>
              <Path
                d="M3.53333 5.26667C2.02 4.87333 1.53333 4.46667 1.53333 3.83333C1.53333 3.10667 2.20667 2.6 3.33333 2.6C4.28 2.6 4.75333 2.96 4.92667 3.53333C5.00667 3.8 5.22667 4 5.50667 4H5.70667C6.14667 4 6.46 3.56667 6.30667 3.15333C6.02667 2.36667 5.37333 1.71333 4.33333 1.46V1C4.33333 0.446667 3.88667 0 3.33333 0C2.78 0 2.33333 0.446667 2.33333 1V1.44C1.04 1.72 0 2.56 0 3.84667C0 5.38667 1.27333 6.15333 3.13333 6.6C4.8 7 5.13333 7.58667 5.13333 8.20667C5.13333 8.66667 4.80667 9.4 3.33333 9.4C2.23333 9.4 1.66667 9.00667 1.44667 8.44667C1.34667 8.18667 1.12 8 0.846667 8H0.66C0.213333 8 -0.1 8.45333 0.0666666 8.86667C0.446667 9.79333 1.33333 10.34 2.33333 10.5533V11C2.33333 11.5533 2.78 12 3.33333 12C3.88667 12 4.33333 11.5533 4.33333 11V10.5667C5.63333 10.32 6.66667 9.56667 6.66667 8.2C6.66667 6.30667 5.04667 5.66 3.53333 5.26667Z"
                fill="#A3A3A3"
              />
            </Svg>
            <TextInput
              style={[styles.inputText, styles.inputValue]}
              placeholder="Deposit due"
              placeholderTextColor="#A3A3A3"
              value={depositDue}
              onChangeText={setDepositDue}
            />
          </View>

          {/* Attachments */}
          <View style={styles.inputField}>
            <Svg width={16} height={16} viewBox="0 0 7.33333 14.6687" style={styles.inputIcon}>
              <Path
                d="M6.33333 3.83278V10.8861C6.33333 12.2794 5.31333 13.5194 3.92667 13.6528C2.33333 13.8061 1 12.5594 1 10.9994V2.75945C1 1.88611 1.62667 1.09278 2.49333 1.00611C3.49333 0.906113 4.33333 1.68611 4.33333 2.66611V9.66611C4.33333 10.0328 4.03333 10.3328 3.66667 10.3328C3.3 10.3328 3 10.0328 3 9.66611V3.83278C3 3.55945 2.77333 3.33278 2.5 3.33278C2.22667 3.33278 2 3.55945 2 3.83278V9.57278C2 10.4461 2.62667 11.2394 3.49333 11.3261C4.49333 11.4261 5.33333 10.6461 5.33333 9.66611V2.77945C5.33333 1.38611 4.31333 0.146113 2.92667 0.0127796C1.34 -0.140554 0 1.10611 0 2.66611V10.8461C0 12.7594 1.4 14.4728 3.30667 14.6528C5.5 14.8528 7.33333 13.1461 7.33333 10.9994V3.83278C7.33333 3.55945 7.10667 3.33278 6.83333 3.33278C6.56 3.33278 6.33333 3.55945 6.33333 3.83278Z"
                fill="#A3A3A3"
              />
            </Svg>
            <Text style={styles.inputText}>Attachments</Text>
            <Text style={styles.uploadText}>upload</Text>
          </View>

          {/* Notes */}
          <View style={styles.notesField}>
            <View style={styles.notesHeader}>
              <Text style={styles.inputText}>Notes</Text>
              <Text style={styles.notesCounter}>{notes.length}/500</Text>
            </View>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes..."
              placeholderTextColor="#A3A3A3"
              value={notes}
              onChangeText={(t) => setNotes(t.slice(0, 500))}
              multiline
              maxLength={500}
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleBook}>
            <LinearGradient
              colors={['#25AFFF', '#25AFFF']}
              style={styles.bookButton}
            >
              <Text style={styles.bookButtonText}>BOOK</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()}>
            <LinearGradient
              colors={['rgba(8, 40, 56, 0.24)', 'rgba(2, 3, 4, 0.72)']}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: hp(1.5) },
  header: {
    height: vs(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
  },
  backButton: { width: ms(15), height: vs(10) },
  headerTitle: {
    flex: 1,
    fontFamily: 'Lato',
    fontSize: ms(16),
    lineHeight: ms(16),
    color: '#FFFFFF',
    textAlign: 'center',
    marginLeft: ms(8),
  },
  headerSpacer: { width: ms(15) },
  customerFieldWrapper: { width: '100%' },
  customerPlaceholder: { color: '#A3A3A3' },
  formContainer: {
    paddingHorizontal: wp(8),
    marginTop: hp(1),
    gap: hp(0.8),
  },
  inputField: {
    minHeight: vs(38),
    backgroundColor: '#1a1a1a',
    borderRadius: ms(8),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.9),
    gap: ms(8),
  },
  inputIcon: { marginRight: 0 },
  inputText: {
    flex: 1,
    fontFamily: 'Lato',
    fontSize: ms(14),
    lineHeight: ms(16),
    color: '#FFFFFF',
    padding: 0,
  },
  inputValue: { color: '#FFFFFF' },
  dateTimeContainer: { flex: 1, gap: hp(0.3) },
  timeText: { fontSize: ms(12), color: '#A3A3A3' },
  depositValue: {
    fontFamily: 'Lato-Bold',
    fontSize: ms(14),
    lineHeight: ms(16),
    color: '#FFFFFF',
  },
  uploadText: {
    fontFamily: 'Lato',
    fontSize: ms(14),
    lineHeight: ms(16),
    color: '#25AFFF',
  },
  switch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  notesField: {
    minHeight: hp(12),
    backgroundColor: '#1a1a1a',
    borderRadius: ms(8),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.9),
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  notesCounter: {
    fontFamily: 'Lato',
    fontSize: ms(14),
    lineHeight: ms(16),
    color: '#A3A3A3',
  },
  notesInput: {
    fontFamily: 'Lato',
    fontSize: ms(14),
    lineHeight: ms(18),
    color: '#FFFFFF',
    minHeight: hp(6),
    padding: 0,
  },
  buttonsContainer: {
    paddingHorizontal: wp(15),
    marginTop: hp(2),
    gap: hp(1.5),
  },
  bookButton: {
    height: vs(42),
    borderRadius: ms(21),
    borderWidth: 1.5,
    borderColor: '#0677B9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: hp(1) },
    shadowOpacity: 1,
    shadowRadius: ms(32),
    elevation: 8,
  },
  bookButtonText: {
    fontFamily: 'Lato-Bold',
    fontSize: ms(12),
    lineHeight: ms(12),
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelButton: {
    height: vs(42),
    borderRadius: ms(21),
    borderWidth: 1.5,
    borderColor: 'rgba(200, 200, 200, 0)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: hp(1) },
    shadowOpacity: 1,
    shadowRadius: ms(32),
    elevation: 8,
  },
  cancelButtonText: {
    fontFamily: 'Lato-Bold',
    fontSize: ms(12),
    lineHeight: ms(12),
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
