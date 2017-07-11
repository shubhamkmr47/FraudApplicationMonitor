import psutil
import csv
import time
import os.path
import json
import numpy as np
from collections import Counter
from sklearn.cluster import KMeans
remember = list()
name_versus_index = dict()
index_versus_name = dict()
final_remember = list()
pid_versus_name = dict()
counter = -1
class Loader:

	def __init__(self, datafile, infofile):
        # features = ['status', 'cpu_num', 'num_ctx_switches', 'pid', 'memory_full_info', 'connections', 'cmdline', 'create_time',\
        # 'ionice', 'num_fds', 'memory_maps', 'cpu_percent', 'terminal', 'ppid', 'cwd', 'nice', 'username', 'cpu_times', 'io_counters',\
        # 'memory_info', 'threads', 'open_files', 'name', 'num_threads', 'exe', 'uids', 'gids', 'cpu_affinity', 'memory_percent', 'environ']
        #self.features = ['num_ctx_switches','memory_full_info','create_time', 'ionice','num_fds','cpu_percent','nice','cpu_times', \
        #'io_counters','num_threads','memory_percent']
        #self.information = ['status','cpu_num','pid','cmdline','ppid','parent','cwd','username','threads','open_files','name',\
        #'exe','uids', 'gids']
		self.features = ['num_threads', 'cpu_times', 'cpu_percent', 'num_ctx_switches', 'memory_full_info', 'io_counters', \
		'memory_percent', 'create_time', 'ionice', 'num_fds', 'nice', 'connections']
		self.information = ['status', 'username', 'exe', 'name', 'gids', 'cpu_num', 'pid', 'cmdline', 'threads', 'open_files', \
		'ppid', 'cwd', 'uids']
		self.datafile = datafile
		self.infofile = infofile


	def adjustData(self,pinfo):
		pinfo['cpu_times_user'] = pinfo['cpu_times'].user
		pinfo['cpu_times_system'] = pinfo['cpu_times'].system
		pinfo['cpu_times_children_user'] = pinfo['cpu_times'].children_user
		pinfo['cpu_times_children_system'] = pinfo['cpu_times'].children_system
		del pinfo['cpu_times']
		pinfo['num_ctx_switches_voluntary'] = pinfo['num_ctx_switches'].voluntary 
		pinfo['num_ctx_switches_involuntary'] = pinfo['num_ctx_switches'].involuntary
		del pinfo['num_ctx_switches']
		pinfo['memory_full_info'] = pinfo['memory_full_info'].uss
		pinfo['io_counters_read_count'] = pinfo['io_counters'].read_count
		pinfo['io_counters_write_count'] = pinfo['io_counters'].write_count
		pinfo['io_counters_read_bytes'] = pinfo['io_counters'].read_bytes
		pinfo['io_counters_write_bytes'] = pinfo['io_counters'].write_bytes
		del pinfo['io_counters']
		pinfo['ionice_ioclass'] = pinfo['ionice'].ioclass
		pinfo['ionice_value']  = pinfo['ionice'].value
		del pinfo['ionice']

		pinfo['create_time'] = time.time() - pinfo['create_time']
		#print pinfo['connections'](kind='inet')

		if(len(pinfo['connections']) > 0 and pinfo['connections'][0].status == 'ESTABLISHED'):
			pinfo['connections'] = 1
		else:
			pinfo['connections'] = 0
	
		#print pinfo['connections']
		return pinfo

	def adjustData1(self,pinfo):
		pinfo['gids_real'] = pinfo['gids'].real
		pinfo['gids_effective'] = pinfo['gids'].effective
		pinfo['gids_saved'] = pinfo['gids'].saved
		del pinfo['gids']
		pinfo['threads_0_id'] = pinfo['threads'][0].id
		pinfo['threads_0_user_time']  = pinfo['threads'][0].user_time
		pinfo['threads_0_system_time']     = pinfo['threads'][0].system_time
		del pinfo['threads']
		pinfo['uids_real'] = pinfo['uids'].real
		pinfo['uids_effective'] = pinfo['uids'].effective
		pinfo['uids_saved'] = pinfo['uids'].saved
		del pinfo['uids']
		return pinfo

	def getProcess(self,w1,w2):
		pids = psutil.pids()
		global remember
		global counter
		for proc in psutil.process_iter():
			#if(proc != psutil.Process()):
			try:
				pinfo = proc.as_dict(attrs = self.information)
			except(AttributeError, UnicodeDecodeError, psutil.AccessDenied, psutil.NoSuchProcess):
				continue 

			#print pinfo
			if(pinfo['status'] == 'running'):
	        		#print pinfo['name']
				pinfo2 = self.adjustData1(pinfo)
				pid_versus_name[pinfo2['pid']] = pinfo2['name']
				row2 = self.getProcessValue(pinfo2)
				w2.writerow(row2)

				pinfo = proc.as_dict(attrs = self.features)
				pinfo1 = self.adjustData(pinfo)
				row1 = self.getProcessValue(pinfo1)
				w1.writerow(row1)
				pinfo1['pid'] = pinfo2['pid']
				pinfo1['ppid'] = pinfo2['ppid']
				if(pinfo2['name'] in name_versus_index):
	                #print pinfo2['name'] , name_versus_index[pinfo2['name']]
					remember[name_versus_index[pinfo2['name']]].append(pinfo1)
				else:
					counter = counter + 1
					name_versus_index[pinfo2['name']] = counter
					index_versus_name[counter] = pinfo2['name']
					remember.append(list())
					#remember[name_versus_index[pinfo2['name']]] = list()
					remember[name_versus_index[pinfo2['name']]].append(pinfo1)
		            
					
					
		         #print pinfo
		#print name_versus_index 
		#print remember

	def getProcessValue(self, pinfo):
		r = list()
		for key, value in pinfo.items():
			r.append(value)
		return r


	def getFile(self):
	    i = 1
	    with open(self.datafile, 'wb') as f1, open(self.infofile, 'wb') as f2:
	        w1 = csv.writer(f1)
	        w2 = csv.writer(f2)

	        header1 = self.setHeader1()
	        header2 = self.setHeader2()

	        w1.writerow(header1)
	        w2.writerow(header2)
	        t_end = time.time() + 1*60
	        while(time.time() < t_end):
	            self.getProcess(w1, w2)
	            #if(len(remember) > 0):
	            #    print len(remember[0])
	                #print name_versus_index
	            #print "Cycle -", i, ":  Time: ", time.ctime(), "====>  Total process running: ",
	            i = i + 1
	        f1.close()
	        f2.close()

	def setHeader1(self):
	    pid = psutil.pids()[0]
	    #print pid
	    try:
	        pinfo = psutil.Process(pid).as_dict(attrs = self.features)
	        #print pinfo
	        #pinfo['time_stamp'] = time.ctime()
	        pinfo = self.adjustData(pinfo)
	        #print pinfo
	    except psutil.NoSuchProcess:
	        pass
	        # print "Error getting process information!!!"

	    r = list()
	    for key, value in pinfo.items():
	            r.append(key)
	    return r

	def setHeader2(self):
	    pid = psutil.pids()[0]
	    try:
	        pinfo = psutil.Process(pid).as_dict(attrs = self.information)
	        #print pinfo
	        #pinfo['time_stamp'] = time.ctime()
	        pinfo = self.adjustData1(pinfo)
	        #print pinfo
	    except psutil.NoSuchProcess:
	        pass
	        # print "Error getting process information!!!"

	    r = list()
	    for key, value in pinfo.items():
	            r.append(key)
	    return r

    
	def ram_versus_cpu(self,cycle_number):
		for key,value in enumerate(remember):
			cpu_percent = 0
			ram = 0
			io = 0
			connect = 0
			features_information = dict()
			for i,val in enumerate(value):
				#if(val['cpu_percent'] > 100 or val['memory_percent'] > 100):
				#	print "kp"
				cpu_percent = cpu_percent + (val['cpu_percent'])/psutil.cpu_count()
				ram = ram + (val['memory_percent'])/psutil.cpu_count()
				io = io + val['io_counters_read_count'] + val['io_counters_write_count']
				connect = connect + val['connections']
				#print val['cpu_percent']
				#print val['pid']
				if val['ppid'] in pid_versus_name:
					#print pid_versus_name[val['ppid']]
					features_information['target' + str(cycle_number)] = name_versus_index[pid_versus_name[val['ppid']]]
					features_information['value' + str(cycle_number)] = 1
				
				#features_information['source' + str(cycle_number)] = key
				#features_information['value' + str(cycle_number)] = 1
			#features_information['name' + str(cycle_number)]=index_versus_name[key]
			if(io != 0):
				features_information['io' + str(cycle_number)] = io/len(value)
			else:
				features_information['io' + str(cycle_number)] = io
			if(cpu_percent != 0):
				features_information['cpu' + str(cycle_number)] = cpu_percent/(len(value))
			else:
				features_information['cpu' + str(cycle_number)] = cpu_percent

			if(ram != 0):
				features_information['ram' + str(cycle_number)] = ram/(len(value))
			else:
				features_information['ram' + str(cycle_number)] = ram

			if(connect != 0):
				features_information['net' + str(cycle_number)] = 1
			else:
				features_information['net' + str(cycle_number)] = 0

			if(len(final_remember) > name_versus_index[index_versus_name[key]]):
				final_remember[name_versus_index[index_versus_name[key]]].update(features_information)
			else:	
				features_information['name'] = index_versus_name[key]
				final_remember.append(features_information)
	
	def feature_vector(self,cycle_number):
		features = []
		for key,value in enumerate(remember):
			temp = []
			if(len(value) > 0):
				feature = (value[0])
				temp = list(value[0].keys())
			else:
				continue
			#print type(value)
			for i,val in enumerate(value):
				for j,key1 in enumerate(temp):
					if(i!=0):
						feature[key1] = feature[key1] + val[key1]
			#print len(feature)
			#feature.pop('pid', None)
			#feature.pop('ppid', None)
			if('pid' in feature):
				feature['pid'] = 0
			if('ppid' in feature):
				feature['ppid'] = 0
			features.append(dict(feature))

		features_1 = []
		for i,value in enumerate(features):
			temp = []
			for key in value:
				temp.append((value[key]))

			#print len(temp)
			features_1.append(temp)
		if(len(features_1) > 2):
			self.Kmeans(features_1,cycle_number)
		#print features_1
		#print np.array(features_1)	

	def Kmeans(self,features,cycle_number):
        # self.getBestK()
		features = np.array(features)
		k = 3
		kmeans = KMeans(n_clusters = k)
		km = kmeans.fit_predict(features)
		links = []
		final_links = {}
		for c in range(0, k):
			index = [i for i, x in enumerate(km) if x == c]
			for i,val in enumerate(index):
				#print final_remember[val]
				final_remember[val].update({ 'type' + str(cycle_number)  : c})
				#print "Cluster: ", c, ":", #self.labels[val]

	def empty(self):
		for i,val in enumerate(remember):
			del remember[i][:]
		#return links



def main():
	global remember
	i = 0
	path1 = '/home/kashish/Documents/intern/DATA1'
	path2 = '/home/kashish/Documents/intern/LABEL1'
	t_end = time.time() + 10*60
	while(time.time() < t_end):
		data = os.path.join(path1,"data" + str(i) + ".csv")
		label = os.path.join(path2,"label" + str(i) + ".csv")
		L = Loader(data, label)
		L.getFile()
		#print remember
		i = i + 1
		L.ram_versus_cpu(i)
		L.feature_vector(i)
		#print remember
		L.empty()
		#print final_remember
		#print pid_versus_name
main()

with open('new_plot.json', 'w') as outfile:
	json.dump(final_remember,outfile)

