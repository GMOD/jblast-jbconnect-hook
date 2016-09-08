import os, sys
sys.path.insert( 0, os.path.dirname( __file__ ) )
#from common import submit

def main():
    try:
        data = {}
        data['workflow_id'] = sys.argv[3]
        data['history'] = sys.argv[4]
        data['ds_map'] = {}
        # DBTODO If only one input is given, don't require a step
        # mapping, just use it for everything?
        for v in sys.argv[5:]:
            step, src, ds_id = v.split('=')
            data['ds_map'][step] = {'src':src, 'id':ds_id}
    except IndexError:
        print 'usage: %s key url workflow_id history step=src=dataset_id' % os.path.basename(sys.argv[0])
        sys.exit(1)
    #submit( sys.argv[1], sys.argv[2], data )
    print data
if __name__ == '__main__':
    main()