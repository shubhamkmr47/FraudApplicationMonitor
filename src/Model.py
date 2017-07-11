import csv
import json
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager

from sklearn import svm
from sklearn import mixture
from sklearn.ensemble import IsolationForest
from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.cluster import KMeans
from scipy import cluster
from sklearn.preprocessing import robust_scale

from sklearn import linear_model, decomposition, datasets
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV

class Model:

    def __init__(self, filename, label):
        reader = csv.reader(open(filename, "rb"), delimiter=",")
        x = list(reader)

        self.header = x[0]
        x.pop(0)

        self.data = np.array(x).astype('float')
        self.n_samples = len(self.data)
        self.n_features = len(self.header)

        reader = csv.reader(open(label, "rb"), delimiter=",")
        x = list(reader)
        x.pop(0)
        x = np.array(x)

        self.labels = np.transpose(x)[0]

        target_value = []
        features = dict()
        f = 0
        target_names = []

        for t in self.labels:
            if t not in features:
                features[t] = f
                target_names.append(t)
                f = f + 1
            target_value.append(features[t])

        self.target_names = np.array(target_names)
        self.label_value = np.array(target_value)

        print 'Number of unique processes:', len(self.target_names)

    def OneClassSvm(self):
        clf = svm.OneClassSVM(nu = 0.1, kernel = "rbf", gamma = 0.1)
        clf.fit(self.data)
        pred = clf.predict(self.data)
        # print pred
        otl = pred[pred == -1].size
        index = np.where(pred == -1)
        print self.labels[index]

    def IsolationForest(self):
        clf = IsolationForest(max_samples = 44, random_state = 20)
        clf.fit(self.data)
        pred = clf.predict(self.data)
        # print pred
        otl = pred[pred == -1].size
        index = np.where(pred == -1)
        print self.labels[index]

        # print otl

    def BoxPlot(self):
        X = np.transpose(self.data)
        X = robust_scale(X, axis=1)
        X = np.transpose(X)
        plt.boxplot(X, 1, '')
        plt.show()

    def PCA(self):

        X = self.data
        y = self.label_value
        f = np.array(range(0, self.n_features))
        target_names = self.target_names

        pca = PCA(n_components = 2)
        X_r = pca.fit(X).transform(X)

        # plt.figure()
        colors = matplotlib.colors.cnames.keys()
        lw = 2
        json_data = []
        for color, i, target_name in zip(colors, f, target_names):
            data = {}
            data['ids'] = str(i)
            data['X'] = str(X_r[i, 0])
            data['Y'] = str(X_r[i, 1])
            data['label'] = target_name
            print data
            json_data.append(data)

        # plt.show()

    def getBestK(self):
        for k in range(1,20):
            km = KMeans(n_clusters = k)
            km = km.fit(self.data)
            labels = km.labels_
            interia = km.inertia_
            print "k:",k, " cost:", interia

        #plot variance for each value for 'k' between 1,10
        initial = [cluster.vq.kmeans(self.data,i) for i in range(1,12)]
        plt.plot([var for (cent,var) in initial])
        plt.title("System's process - K clusters estimation")
        plt.show()

    def Kmeans(self):
        # self.getBestK()
        k = 6
        kmeans = KMeans(n_clusters = k)
        km = kmeans.fit_predict(self.data)

        for c in range(0, k):
            index = [i for i, x in enumerate(km) if x == c]
            print "Cluster: ", c, ":", self.labels[index]

model = Model("data1.csv", "label1.csv")
print "Number of features:", len(model.header)
print "Number of processes:", len(model.data)
# print model.header
# print model.data[1]
model.OneClassSvm()
model.IsolationForest()
# model.BoxPlot()
# model.PCA()
# model.Kmeans()
